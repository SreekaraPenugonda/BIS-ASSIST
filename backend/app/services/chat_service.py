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

CHAT_SYSTEM_PROMPT = """You are the "BIS AI Standards Assistant", an official-style
assistant that helps Indian consumers and MSME manufacturers understand Indian
Standards (IS) and BIS certification.

Ground rules:
1. Answer ONLY from the provided knowledge-base context.
2. Never claim that any product is certified or compliant. State that the
   information is indicative and that licence status must be verified on the
   official BIS portal (bis.gov.in).
3. If you are unsure or the context does not answer the question, say so clearly
   and suggest the official BIS 'Know Your Standard' service.
4. Use **bold** for Indian Standard numbers (e.g. **IS 302 (Part 2-1):2017**).
5. Keep the answer under 200 words, well structured, with short bullet lists.
6. You may greet in Hindi/Telugu/English depending on the user's language.
Respond in the language the user asked in."""

_INTENT_RULES: dict[str, list[str]] = {
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
        for intent, keys in _INTENT_RULES.items():
            if any(key in msg for key in keys):
                return intent
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
        retrieved = self.rag.retrieve(message, k=5)

        answer_text = ""
        mode = "simulation"
        if gemini.available:
            text = gemini.generate(
                CHAT_SYSTEM_PROMPT, self._user_prompt(message, language, retrieved)
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
        retrieved = self.rag.retrieve(message, k=5)

        full_text = ""
        mode = "simulation"

        if gemini.available:
            try:
                for piece in gemini.generate_stream(
                    CHAT_SYSTEM_PROMPT, self._user_prompt(message, language, retrieved)
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
    def _user_prompt(message: str, language: str, retrieved: list[dict]) -> str:
        context = "\n".join(
            f"[{i + 1}] {e['document']} | {e.get('section') or 'Section'}: {e['content'][:900]}"
            for i, e in enumerate(retrieved[:4])
        )
        lang_name = LANGUAGE_NAMES.get(language, "English")
        return (
            f"Language: {lang_name}. Respond in {lang_name}.\n\n"
            f"Knowledge-base context:\n{context or '(no context retrieved)'}\n\n"
            f"Question: {message}"
        )

    def _mock_text(self, message: str, language: str, intent: str, retrieved: list[dict]) -> str:
        lang = language if language in LANGUAGE_NAMES else "en"
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
        for e in retrieved[:4]:
            num = e.get("is_number")
            if num and num not in seen:
                seen.add(num)
                bullets.append(f"- **{num}** — {e.get('title') or 'Applicable standard'}")
        listing = "\n".join(bullets) if bullets else "- *(standard not yet identified)*"

        top = retrieved[0]["content"].split(". ")[0]
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
        summary = f"The closest match in the knowledge base is: {top}." if top else ""

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