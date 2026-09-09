"""Keyword-rules engine: product name/description -> applicable standards.

Heuristic and explainable; used by the MSME recommender and the scanner.
"""
import re
from typing import Optional

from app.data.knowledge_base import normalize_multilingual_query
from app.services import standards_service

BASE_DISCLAIMER = standards_service.STANDARD_DISCLAIMER

# Each rule: category, keywords (lowercase substrings/tokens), standards with
# relevance, and a short explainer shown in the UI.
RULES: list[dict] = [
    {
        "category": "Electrical & Electronics",
        "keywords": [
            "kettle", "iron", "toaster", "mixer", "grinder", "geyser", "heater",
            "coffee", "appliance", "cooker", "induction", "microwave",
            "oven", "washing", "refrigerator", "fridge", "air conditioner", "cooler",
            "fan", "hair dryer", "electric", "ac ",
        ],
        "standards": [
            ("IS 302 (Part 2-1):2017", "high"),
            ("IS 302 (Part 2-15):2018", "high"),
            ("IS 302 (Part 2-11):2018", "medium"),
            ("IS 1293:2019", "medium"),
        ],
        "explain": (
            "Electrical appliances are covered by the IS 302 safety family; specific "
            "Part 2-x standards apply per appliance type."
        ),
    },
    {
        "category": "Lighting Products (LED)",
        "keywords": ["led", "light", "lamp", "bulb", "luminaires", "street light"],
        "standards": [
            ("IS 16102:2013", "high"),
            ("IS 16103:2013", "medium"),
            ("IS 13252:2010", "high"),
            ("IS 302 (Part 2-1):2017", "medium"),
        ],
        "explain": (
            "LED luminaires and drivers are covered by performance standards IS 16102 "
            "and IS 13252 with the IS 302 safety family."
        ),
    },
    {
        "category": "Plugs, Sockets & Wiring",
        "keywords": ["plug", "socket", "switch", "outlet", "extension", "wiring", "cable", "wire"],
        "standards": [
            ("IS 1293:2019", "high"),
            ("IS 694:2010", "high"),
            ("IS 732:1989", "medium"),
            ("IS 3043:1987", "medium"),
        ],
        "explain": "Plugs, sockets and cables fall under compulsory certification standards.",
    },
    {
        "category": "Construction & Cement",
        "keywords": ["cement", "concrete", "construction", "tmt", "rebar", "steel bar",
                     "opc", "rcc", "brick", "building material"],
        "standards": [
            ("IS 269:2015", "high"),
            ("IS 8112:2013", "high"),
            ("IS 12269:2013", "high"),
            ("IS 1786:2008", "high"),
            ("IS 456:2000", "medium"),
            ("IS 800:2007", "medium"),
        ],
        "explain": "Cement, reinforcement steel and concrete works are mandatory-certification products.",
    },
    {
        "category": "Drinking Water & Beverages",
        "keywords": ["water", "mineral water", "bottled water", "packaged", "drinking"],
        "standards": [
            ("IS 14543:2016", "high"),
            ("IS 13428:1998", "medium"),
            ("IS 10500:2019", "medium"),
        ],
        "explain": "Packaged drinking water and mineral water are mandatory certification products.",
    },
    {
        "category": "LPG & Gas Kitchen Equipment",
        "keywords": ["lpg", "gas", "stove", "cylinder", "regulator", "burner", "cooking range"],
        "standards": [
            ("IS 3196:1992", "high"),
            ("IS 1797:2016", "high"),
            ("IS 2082:2019", "medium"),
        ],
        "explain": "LPG cylinders and domestic gas stoves are statutorily regulated products.",
    },
    {
        "category": "Transportation & Safety Equipment",
        "keywords": ["helmet", "two wheeler", "rider", "fire", "extinguisher"],
        "standards": [
            ("IS 4151:2015", "high"),
            ("IS 2190:2010", "high"),
        ],
        "explain": "Protective helmets and portable fire extinguishers carry mandatory certification.",
    },
    {
        "category": "Toys & Child Safety",
        "keywords": ["toy", "child", "kids", "baby", "play", "rattle", "doll"],
        "standards": [
            ("IS 9873 (Part 1):2017", "high"),
            ("IS 9873 (Part 3):2017", "high"),
        ],
        "explain": "Toys for children under 14 are under mandatory certification (IS 9873 series).",
    },
    {
        "category": "Medical & Hygiene Products",
        "keywords": ["mask", "surgical", "medical", "bandage", "sanitizer", "glove"],
        "standards": [
            ("IS 16289:2011", "high"),
            ("IS 4736:2015", "medium"),
        ],
        "explain": "Medical consumables follow dedicated Indian Standards; verify scope before certifying.",
    },
    {
        "category": "Renewable Energy Products",
        "keywords": ["solar", "water heater", "thermal", "renewable", "inverter"],
        "standards": [
            ("IS 12933:2003", "high"),
            ("IS 16103:2013", "medium"),
        ],
        "explain": "Solar heating systems follow IS 12933; outdoor lighting follows IS 16103.",
    },
    ]

GENERAL_RULE = {
    "category": "General / Other Products",
    "standards": [
        ("IS 302 (Part 2-1):2017", "low"),
        ("IS 1293:2019", "low"),
    ],
    "explain": (
        "The product did not clearly match a seeded category. Use the official BIS "
        "'Know Your Standard' service to confirm applicable standards."
    ),
}


def _clean(text: str) -> str:
    return re.sub(r"[^a-z0-9 ]", " ", normalize_multilingual_query(text).lower())


def recommend(product_name: str, description: Optional[str] = None, category: Optional[str] = None) -> dict:
    hay = _clean(f"{product_name} {description or ''} {category or ''}")
    best_rule = None
    best_score = 0
    for rule in RULES:
        score = sum(hay.count(keyword) for keyword in rule["keywords"] if len(keyword) >= 2)
        if score > best_score:
            best_score, best_rule = score, rule
    rule = best_rule if best_rule and best_score > 0 else GENERAL_RULE

    standards_out: list[dict] = []
    for is_number, relevance in rule["standards"]:
        std = standards_service.get_standard(is_number)
        if std:
            standards_out.append(
                {
                    "is_number": std["is_number"],
                    "title": std["title"],
                    "relevance": relevance,
                    "status": std["status"],
                    "scope": std["scope"][:260],
                }
            )
    return {
        "product": product_name.strip(),
        "category": rule["category"],
        "standards": standards_out,
        "disclaimer": BASE_DISCLAIMER,
    }


def category_for_text(text: str) -> Optional[str]:
    hay = _clean(text)
    best_rule, best_score = None, 0
    for rule in RULES:
        score = sum(hay.count(k) for k in rule["keywords"] if len(k) >= 2)
        if score > best_score:
            best_score, best_rule = score, rule
    return best_rule["category"] if best_rule and best_score > 0 else None