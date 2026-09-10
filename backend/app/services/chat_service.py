"""Chat orchestration: intent detection -> RAG retrieval -> Gemini / simulation
-> structured answer with standards + source citations (with streaming).

Runs identically with or without a Gemini API key: without a key the answers are
generated deterministically from the retrieved knowledge-base chunks so the demo
is always fully functional.
"""
import asyncio
from typing import AsyncIterator, Optional

from app.data.knowledge_base import DISCLAIMER
from app.core.stats import stats
from app.services import rag_service, recommendation_service, standards_service
from app.services.gemini_service import gemini

LANGUAGE_NAMES = {"en": "English", "hi": "Hindi", "te": "Telugu"}
_AI_MAX_TOKENS = 900

# Queries that are clearly outside the BIS domain (small-talk, homework,
# weather, politics, ...). They get a polite redirect instead of a forced
# retrieval answer so the assistant stays trustworthy.
OFF_TOPIC_PATTERNS = [
    "weather", "temperature outside", "cricket score", "movie", "film ",
    "song", "joke", "politics", "election", "cricketer", "actor",
    "homework", "maths", "mathematics", "essay on", "poem",
    "what is your name", "who are you", "how are you",
    "मौसम", "जोक", "कविता", "निबंध", "गाना", "फिल्म",
    "వాతావరణం", "జోక్", "సినిమా", "పాట", "కవిత",
]
FEE_WORDS = {"fee", "fees", "cost", "price", "charge", "charges", "payment", "शुल्क", "कीमत", "రుసుము"}
COMPLAINT_WORDS = {"complaint", "grievance", "report seller", "fake mark", "counterfeit", "शिकायत", "ఫిర్యాదు"}
CONTACT_WORDS = {"contact", "helpline", "toll free", "phone number", "email", "address", "office"}

SALUTATIONS = {
    "en": "नमस्ते! Namaste 🙏",
    "hi": "नमस्ते! 🙏",
    "te": "నమస్కారం! 🙏",
}
HINDI_NOTE = (
    "पूर्ण हिंदी उत्तर के लिए GEMINI_API_KEY सेट करें। नीचे दी गई जानकारी संदर्भ के "
    "लिए दी गई है:"
)
TELUGU_NOTE = (
    "పూర్తి తెలుగు సమాధానం కోసం GEMINI_API_KEY సెట్ చేయండి. దిగువ సమాచారం సూచన కోసం:"
)

# ---------------------------------------------------------------- prompts
CHAT_SYSTEM_PROMPT = """You are the "BIS AI Standards Assistant" — an expert on Indian
Standards (IS) and BIS certification, helping Indian consumers and MSME manufacturers.

GROUND RULES (strict):
1. Answer ONLY from the provided CONTEXT. If the context is insufficient, say so
   clearly and point to bis.gov.in → 'Know Your Standard'. Never invent IS numbers,
   dates, fees or clause numbers.
2. NEVER claim any product is certified/compliant. Licence status must always be
   verified on the official BIS portal (bis.gov.in).
3. Bold every Indian Standard number, e.g. **IS 302 (Part 2-1):2017**.
4. Cite context entries you use inline as [1], [2].

ANSWER STRUCTURE (markdown, under 220 words):
**Answer:** one or two sentences that directly answer the question.
**Key points:** 3-5 short bullets with specifics pulled from the context
(numbers, requirements, timelines, standard references) — cite [n].
**What to do next:** 1-3 concrete action bullets (verify on bis.gov.in, run the
label scanner, file an application).
Only include a section if it adds information. Reply in the user's language."""


def build_context_block(retrieved: list[dict], max_chars: int = 3500) -> str:
    """Pack retrieved chunks into a numbered, source-labelled context block."""
    if not retrieved:
        return "CONTEXT: (no relevant entries found)"
    parts: list[str] = []
    used = 0
    for i, e in enumerate(retrieved, 1):
        head = f"[{i}] {e.get('document', 'Knowledge base')}"
        if e.get("section"):
            head += f" — {e['section']}"
        if e.get("page"):
            head += f" (p.{e['page']})"
        content = (e.get("content") or "").strip()
        content = content[: 900] + ("…" if len(content) > 900 else "")
        block = f"{head}\n{content}"
        if used + len(block) > max_chars and parts:
            break
        parts.append(block)
        used += len(block)
    return "CONTEXT (cite entries as [n] when used):\n\n" + "\n\n".join(parts)



_INTENT_RULES: dict[str, list[str]] = {
    "greeting": [
        "hello", "hi ", "hey", "good morning", "good afternoon", "good evening",
        "namaste", "namaskar", "thank", "thanks", "dhanyavad", "धन्यवाद",
        "नमस्ते", "నమస్కారం",
    ],
    "fee": [
        "fee", "fees", "cost", "price", "charge", "payment", "how much",
        "शुल्क", "कीमत", "రుసుము",
    ],
    "complaint": [
        "complaint", "grievance", "report ", "fake mark", "counterfeit",
        "misuse of", "शिकायत", "ఫిర్యాదు",
    ],
    "contact": [
        "contact", "helpline", "toll free", "toll-free", "phone number",
        "email", "address", "office", "customer care",
    ],
    "off_topic": OFF_TOPIC_PATTERNS,
    "certification": [
        "certif", "licence", "license", "apply", "scheme", "standard mark",
        "isi mark", "how do i get", "how to get", "registration",
    ],
    "scanner": ["scan", "scan a product", "check my product", "verify product", "product label"],
    "standard_search": [
        "is number", "which standard", "standard for", "applicable standard",
        "guideline", "is there a standard", "which is",
    ],
}

SALUTATION_WORDS = {
    "hello", "hi", "hey", "namaste", "नमस्ते", "నమస్కారం", "వనక్కం", "vanakkam",
}


class ChatService:
    def __init__(self) -> None:
        self.rag = rag_service.rag_index

    # ------------------------------------------------------------ intent
    def detect_intent(self, message: str) -> str:
        msg = message.lower().strip()
        words = set(msg.split())
        if words & SALUTATION_WORDS or msg in {"hi", "helo", "hello", "hey"}:
            return "greeting"
        # Check specific intents first (insertion ordered: greeting/fee/... before general).
        for intent, keys in _INTENT_RULES.items():
            if any(key in msg for key in keys):
                return intent
        # IS-number pattern like "IS 10500" or "IS:302" -> standard lookup.
        import re as _re
        if _re.search(r"\bis\s*\d{2,5}\b", msg):
            return "standard_search"
        if recommendation_service.category_for_text(msg):
            return "product_compliance"
        return "general"

    # ------------------------------------------------------------ process
    def process(
        self,
        message: str,
        language: str = "en",
        history: Optional[list[dict]] = None,
    ) -> dict:
        intent = self.detect_intent(message)
        retrieved = self.rag.retrieve(message, k=8)

        answer_text = ""
        mode = "simulation"
        if gemini.available:
            text = gemini.generate(
                CHAT_SYSTEM_PROMPT, self._user_prompt(message, language, retrieved, history)
            )
            if text:
                answer_text = text
                mode = "ai"

        if not answer_text:
            answer_text = self._mock_text(message, language, intent, retrieved)

        structured = self._structure(answer_text, intent, retrieved, language, ai=(mode == "ai"))
        structured["intent"] = intent
        structured["mode"] = mode  # ai | simulation
        stats.record_query(message[:160], mode, intent, structured["status"])
        return {"mode": mode, "intent": intent, "structured": structured}

    # ------------------------------------------------------------ stream
    async def stream(
        self,
        message: str,
        language: str = "en",
        history: Optional[list[dict]] = None,
    ) -> AsyncIterator[dict]:
        intent = self.detect_intent(message)
        retrieved = self.rag.retrieve(message, k=8)

        full_text = ""
        mode = "simulation"

        if gemini.available:
            try:
                for piece in gemini.generate_stream(
                    CHAT_SYSTEM_PROMPT, self._user_prompt(message, language, retrieved, history)
                ):
                    if not piece:
                        continue
                    mode = "ai"
                    full_text += piece
                    yield {"type": "token", "content": piece}
            except Exception:
                pass

        if not full_text:
            mode = "simulation"
            full_text = self._mock_text(message, language, intent, retrieved)
            for chunk in self._chunks(full_text, size=22):
                yield {"type": "token", "content": chunk}
                await asyncio.sleep(0.004)

        structured = self._structure(full_text, intent, retrieved, language, ai=(mode == "ai"))
        structured["intent"] = intent
        structured["mode"] = mode  # ai | simulation
        stats.record_query(message[:160], mode, intent, structured["status"])
        yield {"type": "meta", "meta": structured}
        yield {"type": "done", "meta": structured}

    # ------------------------------------------------------------ helpers
    @staticmethod
    def _history_block(history: Optional[list[dict]], max_turns: int = 4) -> str:
        """Condense recent conversation turns into a compact recap block."""
        if not history:
            return ""
        turns: list[str] = []
        for turn in history[-max_turns:]:
            role = turn.get("role", "user")
            content = (turn.get("content") or "").strip().replace("\n", " ")
            if not content:
                continue
            tag = "User" if role == "user" else "Assistant"
            turns.append(f"{tag}: {content[:180]}")
        if not turns:
            return ""
        return "RECENT CONVERSATION (for pronoun/context resolution only):\n" + "\n".join(turns)

    @staticmethod
    def _user_prompt(
        message: str,
        language: str,
        retrieved: list[dict],
        history: Optional[list[dict]] = None,
    ) -> str:
        lang_name = LANGUAGE_NAMES.get(language, "English")
        context = build_context_block(retrieved)
        history_block = ChatService._history_block(history)
        parts = [
            f"Language: respond ONLY in {lang_name}.",
        ]
        if history_block:
            parts.append(history_block)
        parts.append(context)
        parts.append(f"Question: {message}")
        return "\n\n".join(parts)

    def _mock_text(self, message: str, language: str, intent: str, retrieved: list[dict]) -> str:
        lang = language if language in LANGUAGE_NAMES else "en"
        if intent == "off_topic":
            if lang == "hi":
                return (
                    "मैं BIS मानकों, प्रमाणन (ISI/CRS/हॉलमार्किंग/FMCS/QCO) और उत्पाद अनुपालन पर ही "
                    "सहायता करता हूँ, इसलिए इस विषय पर उत्तर नहीं दे सकता।\n\n"
                    "आप पूछ सकते हैं: *मेरे इलेक्ट्रिक केतली पर कौन-सा IS लागू होता है?* या "
                    "*BIS प्रमाणन कैसे प्राप्त करें?*"
                )
            if lang == "te":
                return (
                    "నేను BIS ప్రమాణాలు, ధృవీకరణ (ISI/CRS/హాల్‌మార్కింగ్/FMCS/QCO) మరియు ఉత్పత్తి "
                    "అనుకూలతపై మాత్రమే సహాయం చేస్తాను, కాబట్టి ఈ అంశంపై సమాధానం ఇవ్వలేను.\n\n"
                    "మీరు అడగవచ్చు: *నా ఎలక్ట్రిక్ కెటిల్‌కు ఏ IS వర్తిస్తుంది?* లేదా "
                    "*BIS ధృవీకరణ ఎలా పొందాలి?*"
                )
            return (
                "I can only help with BIS standards, certification (ISI mark, CRS, hallmarking, "
                "FMCS, QCOs), product compliance, testing and labelling — so I can't answer "
                "that topic.\n\nTry asking:\n"
                "- *Which IS applies to my electric kettle?*\n"
                "- *How do I get a BIS licence?*\n"
                "- *Is CRS registration needed for my LED bulb?*"
            )
        if intent in ("fee", "complaint", "contact"):
            picked = [e for e in retrieved if "misc_queries_faq" in e.get("document", "")]
            snippet = (" " + picked[0]["content"][:550]) if picked else ""
            if intent == "fee" and lang == "hi":
                return (
                    "BIS शुल्क योजना पर निर्भर करता है (आवेदन, परीक्षण/निरीक्षण, वार्षिक लाइसेंस और "
                    f"मार्किंग शुल्क)।{snippet}\n\nवर्तमान शुल्क bis.gov.in / Manakonline पर सत्यापित करें।"
                    + self._trailing(lang)
                )
            if intent == "fee" and lang == "te":
                return (
                    "BIS రుసుము పథకాన్ని బట్టి ఉంటుంది (దరఖాస్తు, పరీక్ష/తనిఖీ, వార్షిక లైసెన్స్ మరియు "
                    f"మార్కింగ్ రుసుము).{snippet}\n\nప్రస్తుత రుసుములను bis.gov.in / Manakonlineలో ధృవీకరించండి."
                    + self._trailing(lang)
                )
            if intent == "fee":
                return (
                    "BIS fees depend on the scheme (application + testing/inspection + annual "
                    f"licence + marking fee; CRS charges per model).{snippet}\n\n"
                    "Confirm the current fee schedule on bis.gov.in / Manakonline before paying anyone."
                    + self._trailing(lang)
                )
            if intent == "complaint":
                base = (
                    "Verify the mark on bis.gov.in → 'Verify Licence' (or the BIS Care app), keep the "
                    f"invoice and photos of the mark,{snippet} or call toll-free 1800-11-3999."
                )
                if lang == "hi":
                    base = ("bis.gov.in → 'Verify Licence' (या BIS Care ऐप) पर निशान सत्यापित करें, बिल और "
                            f"निशान की फोटो रखें।{snippet} या टोल-फ्री 1800-11-3999 पर कॉल करें।")
                if lang == "te":
                    base = ("bis.gov.in → 'Verify Licence' (లేదా BIS Care యాప్)లో గుర్తును ధృవీకరించండి, "
                            f"ఇన్‌వాయిస్ మరియు గుర్తు ఫోటోలు ఉంచండి.{snippet} లేదా టోల్-ఫ్రీ 1800-11-3999కు కాల్ చేయండి.")
                return base + self._trailing(lang)
            # contact
            if lang == "hi":
                return (
                    "BIS से संपर्क: bis.gov.in → 'Contact Us', BIS Care ऐप, या टोल-फ्री 1800-11-3999। "
                    "शिकायत के लिए BIS शिकायत पोर्टल का उपयोग करें।"
                    + self._trailing(lang)
                )
            if lang == "te":
                return (
                    "BISను సంప్రదించండి: bis.gov.in → 'Contact Us', BIS Care యాప్, లేదా టోల్-ఫ్రీ "
                    "1800-11-3999. ఫిర్యాదు కోసం BIS ఫిర్యాదు పోర్టల్ ఉపయోగించండి."
                    + self._trailing(lang)
                )
            return (
                "Contact BIS via bis.gov.in → 'Contact Us', the BIS Care app, or toll-free "
                "1800-11-3999. For misuse of the ISI mark use the BIS complaint portal."
                + self._trailing(lang)
            )
        if intent == "greeting":
            if lang == "hi":
                return (
                    f"{SALUTATIONS['hi']} मैं BIS AI Standards Assistant हूँ। मैं भारतीय मानकों, "
                    "उत्पाद सुरक्षा और BIS प्रमाणन को समझने में आपकी सहायता कर सकता हूँ।\n\n"
                    "आप उत्पाद, प्रमाणन प्रक्रिया या किसी मानक के बारे में पूछ सकते हैं।"
                )
            if lang == "te":
                return (
                    f"{SALUTATIONS['te']} నేను BIS AI Standards Assistantను. భారతీయ ప్రమాణాలు, "
                    "ఉత్పత్తి భద్రత మరియు BIS ధృవీకరణ గురించి వివరించగలను.\n\n"
                    "ఉత్పత్తి, ధృవీకరణ ప్రక్రియ లేదా ఏదైనా ప్రమాణం గురించి అడగండి."
                )
            return (
                f"{SALUTATIONS.get(lang, SALUTATIONS['en'])} I am the BIS AI Standards Assistant. "
                "I help you understand Indian Standards, check product compliance, and guide "
                "MSMEs through certification.\n\nAsk me things like:\n"
                "- *Which IS applies to my electric kettle?*\n"
                "- *How does BIS certification work?*\n"
                "- *What is the standard for drinking water?*"
            )

        if intent == "scanner":
            if lang == "hi":
                return (
                    "भौतिक उत्पाद की जाँच के लिए साइडबार में **Product Scanner** खोलें। "
                    "लेबल की साफ़ तस्वीर अपलोड करें; सहायक उत्पाद का प्रकार, BIS Standard Mark "
                    "और संभावित मानक बताएगा।\n\n"
                    "ध्यान दें: स्कैन से प्रमाणन की पुष्टि नहीं होती। लाइसेंस नंबर को आधिकारिक BIS पोर्टल पर सत्यापित करें।"
                )
            if lang == "te":
                return (
                    "భౌతిక ఉత్పత్తిని తనిఖీ చేయడానికి సైడ్‌బార్‌లోని **Product Scanner** తెరవండి. "
                    "లేబుల్ యొక్క స్పష్టమైన ఫోటోను అప్‌లోడ్ చేయండి; సహాయకుడు ఉత్పత్తి రకం, BIS Standard Mark "
                    "మరియు వర్తించే ప్రమాణాలను చూపిస్తాడు.\n\n"
                    "గమనిక: స్కాన్‌తో ధృవీకరణ నిర్ధారించబడదు. లైసెన్స్ నంబర్‌ను అధికారిక BIS పోర్టల్‌లో తనిఖీ చేయండి."
                )
            return (
                "To check a physical product, use the **Product Scanner** in the sidebar: "
                "upload a clear photo of the product label and the assistant will detect the "
                "product type, look for the BIS Standard Mark and list the potentially "
                "applicable standards.\n\nNote: a scan alone never confirms certification — "
                "verification of the licence number must be done on the official BIS portal."
            )

        if intent == "certification":
            if lang == "hi":
                return (
                    "BIS प्रमाणन में निर्माता द्वारा उत्पाद और गुणवत्ता-प्रणाली की जानकारी देना, "
                    "प्रयोगशाला परीक्षण और कारखाना निरीक्षण शामिल हैं। इसके बाद लाइसेंस मिलने पर "
                    "Standard Mark का उपयोग किया जा सकता है।\n\n"
                    "पहले अपने उत्पाद का लागू भारतीय मानक सुनिश्चित करें और bis.gov.in पर आधिकारिक जानकारी सत्यापित करें।"
                    + self._trailing(lang)
                )
            if lang == "te":
                return (
                    "BIS ధృవీకరణలో తయారీదారు ఉత్పత్తి మరియు నాణ్యత వ్యవస్థ వివరాలను సమర్పించడం, "
                    "ప్రయోగశాల పరీక్షలు మరియు కర్మాగార తనిఖీ ఉంటాయి. లైసెన్స్ వచ్చిన తర్వాత Standard Mark "
                    "ను ఉపయోగించవచ్చు.\n\n"
                    "ముందుగా మీ ఉత్పత్తికి వర్తించే భారతీయ ప్రమాణాన్ని నిర్ధారించి, bis.gov.inలో అధికారిక సమాచారాన్ని తనిఖీ చేయండి."
                    + self._trailing(lang)
                )
            cert_docs = [e for e in retrieved if "certification" in e["document"].lower()]
            if cert_docs:
                summary = cert_docs[0]["content"][:600]
                return (
                    f"Here is what the knowledge base says about BIS certification:\n\n{summary}"
                    + self._trailing(lang)
                )
            return (
                "BIS certification follows the **Certification Marks Scheme**: a manufacturer "
                "applies to BIS with product, plant and quality-system details; samples are "
                "tested in an independent laboratory; and the plant is inspected before a "
                "licence to use the Standard Mark (ISI mark) is granted. Licensed units are "
                "then subject to surveillance testing.\n\nFor your exact product, first "
                "confirm which Indian Standard applies, then contact the concerned BIS "
                "department or check bis.gov.in."
            )
        return self._default_mock(retrieved, intent, lang)

    def _default_mock(self, retrieved: list[dict], intent: str, lang: str) -> str:
        if not retrieved:
            if lang == "hi":
                return (
                    "मौजूदा BIS ज्ञान आधार में स्पष्ट मिलान नहीं मिला। कृपया उत्पाद का प्रकार, "
                    "सामग्री और उपयोग लिखकर फिर पूछें, या **Standards** पेज देखें। आधिकारिक जानकारी के लिए bis.gov.in का "
                    "'Know Your Standard' सेवा उपयोग करें।"
                )
            if lang == "te":
                return (
                    "ప్రస్తుత BIS జ్ఞాన ఆధారంలో స్పష్టమైన సరిపోలిక దొరకలేదు. ఉత్పత్తి రకం, పదార్థం "
                    "మరియు వినియోగాన్ని వివరించి మళ్లీ అడగండి లేదా **Standards** పేజీని చూడండి. అధికారిక సమాచారం కోసం bis.gov.inలో "
                    "'Know Your Standard' సేవను ఉపయోగించండి."
                )
            if intent in ("product_compliance", "standard_search"):
                return (
                    "I could not find a clear match in the current knowledge base. Please "
                    "rephrase with more detail (product type, material, use), or use the "
                    "**Standards** page to browse by category. For authoritative details, "
                    "use the official BIS portal (bis.gov.in → 'Know Your Standard')."
                )
            return (
                "I can help with Indian Standards, product compliance and BIS certification. "
                "Try asking 'Which IS applies to my electric kettle?' or 'How do I get a BIS "
                "licence?'"
            )

        bullets = []
        seen: set[str] = set()
        for e in retrieved[:6]:
            num = e.get("is_number")
            if num and num not in seen:
                seen.add(num)
                bullets.append(f"- **{num}** — {e.get('title') or 'Applicable standard'}")
        listing = "\n".join(bullets) if bullets else "- *(standard not yet identified)*"

        tops = []
        for e in retrieved[:3]:
            first = (e.get("content") or "").split(". ")[0].strip()
            if first and first not in tops:
                tops.append(first)
        joined = " ".join(f"{t}." if not t.endswith(".") else t for t in tops)
        if lang == "hi":
            return (
                f"BIS ज्ञान आधार के अनुसार:\n\n**संभावित लागू मानक:**\n{listing}\n\n"
                "ऊपर दिए गए मानक आपके प्रश्न से सबसे अधिक संबंधित पाए गए हैं।\n\n"
                "यह जानकारी केवल संकेतात्मक है। आधिकारिक BIS पोर्टल पर सत्यापन आवश्यक है।"
                + self._trailing(lang)
            )
        if lang == "te":
            return (
                f"BIS జ్ఞాన ఆధారం ప్రకారం:\n\n**వర్తించే అవకాశం ఉన్న ప్రమాణాలు:**\n{listing}\n\n"
                "పై ప్రమాణాలు మీ ప్రశ్నకు అత్యంత సంబంధం ఉన్నవిగా గుర్తించబడ్డాయి.\n\n"
                "ఇది సూచనాత్మక సమాచారం మాత్రమే. అధికారిక BIS పోర్టల్‌లో తప్పనిసరిగా ధృవీకరించండి."
                + self._trailing(lang)
            )
        summary = f"The closest matches in the knowledge base: {joined}" if joined else ""

        return (
            f"Based on the BIS knowledge base, here is what we found:\n\n"
            f"**Potentially applicable standards:**\n{listing}\n\n"
            f"{summary}\n\n"
            "These indications are derived from retrieved knowledge-base entries and are "
            "indicative only — they must be verified on the official BIS portal."
            + self._trailing(lang)
        )

    @staticmethod
    def _trailing(lang: str) -> str:
        if lang == "hi":
            return f"\n\n*नोट:* {HINDI_NOTE}"
        if lang == "te":
            return f"\n\n*గమనిక:* {TELUGU_NOTE}"
        return ""

    @staticmethod
    def _chunks(text: str, size: int = 26) -> list[str]:
        words = text.split(" ")
        batches = []
        for i in range(0, len(words), size):
            batches.append(" ".join(words[i : i + size]) + (" " if i + size < len(words) else ""))
        return batches or [text]

    def _structure(
        self,
        answer_text: str,
        intent: str,
        retrieved: list[dict],
        language: str,
        ai: bool,
    ) -> dict:
        standards: list[dict] = []
        seen: set[str] = set()
        for e in retrieved:
            num = e.get("is_number")
            if num and num not in seen:
                seen.add(num)
                standards.append(
                    {
                        "is_number": num,
                        "title": e.get("title") or "Applicable standard",
                        "relevance": "high" if len(standards) == 0 else "medium",
                        "status": "CURRENT",
                    }
                )
            if len(standards) >= 4:
                break

        sources: list[dict] = []
        seen_docs: set[str] = set()
        for e in retrieved:
            doc = e.get("document", "")
            if doc and doc not in seen_docs:
                seen_docs.add(doc)
                sources.append(
                    {
                        "document": doc,
                        "page": e.get("page"),
                        "section": e.get("section"),
                        "url": e.get("url"),
                    }
                )
            if len(sources) >= 4:
                break

        top_score = retrieved[0].get("score", 0.0) if retrieved else 0.0
        if intent == "greeting":
            status = "INFO"
            confidence = 1.0
        elif intent in ("product_compliance", "certification", "scanner"):
            status = "VERIFICATION_REQUIRED"
            confidence = min(0.8 if not ai else 0.95, 0.45 + top_score)
        elif retrieved:
            status = "INFO"
            confidence = min(0.80 if not ai else 0.95, 0.45 + top_score)
        else:
            status = "NOT_FOUND"
            confidence = 0.2

        disclaimer = DISCLAIMER
        if not ai:
            disclaimer += (
                " (Simulation mode: no GEMINI_API_KEY configured — answers are derived "
                "deterministically from the retrieved knowledge-base chunks.)"
            )
        return {
            "answer": answer_text,
            "status": status,
            "confidence": round(float(confidence), 2),
            "intent": intent,
            "language": language,
            "standards": standards,
            "sources": sources,
            "disclaimer": disclaimer,
        }


chat_service = ChatService()