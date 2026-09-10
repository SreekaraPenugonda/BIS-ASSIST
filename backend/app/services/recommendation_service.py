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
            "coffee", "appliance", "induction", "microwave",
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
            ("IS 16102 (Part 1):2012", "high"),
            ("IS 13252 (Part 1):2010", "medium"),
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
        "keywords": [
            "packaged drinking", "packaged water", "mineral water", "bottled water",
            "packaged", "drinking", "mineral", "bottled",
        ],
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
        "category": "Automotive, Tyres & Electric Vehicles",
        "keywords": ["tyre", "tire", "ev ", "electric vehicle",
                      "electric scooter", "charging", "automobile", "vehicle"],
        "standards": [
            ("IS 17017 (Part 1):2018", "high"),
            ("IS 15627:2021", "high"),
            ("IS 16893 (Part 2):2018", "medium"),
        ],
        "explain": "EV charging systems, automotive tyres and EV batteries carry dedicated IS requirements.",
    },
    {
        "category": "Batteries & Power Storage",
        "keywords": ["battery", "lithium", "power bank", "ups", "inverter battery", "lead acid", "rechargeable"],
        "standards": [
            ("IS 16046 (Part 2):2018", "high"),
            ("IS 16893 (Part 2):2018", "medium"),
            ("IS 13369:1992", "medium"),
        ],
        "explain": "Portable lithium cells fall under CRS while EV traction and automotive batteries have their own IS.",
    },
    {
        "category": "Cosmetics & Personal Care",
        "keywords": ["cosmetic", "cream", "lotion", "lipstick", "shampoo", "soap", "toilet soap", "beauty", "perfume"],
        "standards": [
            ("IS 4707 (Part 1):2017", "high"),
            ("IS 2888:2004", "high"),
        ],
        "explain": "Cosmetics follow IS 4707 classification; toilet soaps are graded by TFM under IS 2888.",
    },
    {
        "category": "Footwear & Leather",
        "keywords": ["shoe", "safety shoe", "boot", "gumboot", "chappal", "slipper", "sandal", "footwear", "leather"],
        "standards": [
            ("IS 6721:2023", "high"),
            ("IS 17012:2018", "high"),
        ],
        "explain": "Safety footwear and rubber hawai chappal are under mandatory QCO certification.",
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
            ("IS 16102:2013", "medium"),
        ],
        "explain": "Solar heating systems follow IS 12933; outdoor lighting follows IS 16103.",
    },
    {
        "category": "Automotive & Electric Vehicles",
        "keywords": ["electric vehicle", " ev ", "ev ", "charging", "charger station", "ccs2", "tyre", "tire", "bike tyre", "scooter", "car ", "motorcycle", "automotive", "vehicle"],
        "standards": [
            ("IS 17017 (Part 1):2018", "high"),
            ("IS 15627:2021", "high"),
            ("IS 16893 (Part 2):2018", "medium"),
            ("IS 13369:1992", "medium"),
        ],
        "explain": "EV charging systems, two-wheeler tyres and traction batteries follow dedicated automotive standards.",
    },
    {
        "category": "Batteries & Power Storage",
        "keywords": ["battery", "lithium", "power bank", "ups", "inverter battery", "traction battery", "bms", "lead acid"],
        "standards": [
            ("IS 16046 (Part 2):2018", "high"),
            ("IS 16893 (Part 2):2018", "high"),
            ("IS 13369:1992", "medium"),
        ],
        "explain": "Portable lithium cells fall under CRS while EV traction packs and automotive batteries follow dedicated standards.",
    },
    {
        "category": "Cosmetics & Personal Care",
        "keywords": ["cosmetic", "cream", "lotion", "lipstick", "shampoo", "soap", "toilet soap", "beauty", "personal care", "tfm"],
        "standards": [
            ("IS 4707 (Part 1):2017", "high"),
            ("IS 2888:2004", "high"),
        ],
        "explain": "Cosmetics follow the IS 4707 safety framework while toilet soaps are graded under IS 2888.",
    },
    {
        "category": "Jewellery & Precious Metals",
        "keywords": ["gold", "silver", "jewellery", "jewelry", "hallmark", "22k", "916", "artefact", "ornament"],
        "standards": [
            ("IS 1417:2016", "high"),
            ("IS 2112:2014", "high"),
        ],
        "explain": "Gold and silver jewellery must meet fineness grades with the five-mark BIS hallmark.",
    },
    {
        "category": "Pressure Vessels & Gas Equipment",
        "keywords": ["pressure cooker", "pressure", "cylinder", "regulator", "lpg regulator", "gas cylinder"],
        "standards": [
            ("IS 14612:1998", "high"),
            ("IS 3196 (Part 1):2013", "high"),
            ("IS 9798:2013", "high"),
        ],
        "explain": "Pressure cookers, LPG cylinders and regulators each carry mandatory certification.",
    },
    {
        "category": "Pipes, Plumbing & Sanitaryware",
        "keywords": ["pipe", "pvc", "upvc", "plumbing", "tap", "faucet", "toilet", "sanitary", "cistern", "flush", "bathroom", "water closet"],
        "standards": [
            ("IS 4985:2021", "high"),
            ("IS 2556 (Part 1):1994", "medium"),
            ("IS 774:2004", "medium"),
            ("IS 2065:1983", "medium"),
        ],
        "explain": "uPVC water pipes, closets and cisterns follow dedicated plumbing and sanitaryware standards.",
    },
    {
        "category": "Electronics & IT (CRS)",
        "keywords": ["laptop", "computer", "mobile phone", "smartphone", "tablet", "television", " tv ", "set top", "speaker", "crs", "registration", "r-number", "cctv", "smart watch", "charger", "adaptor", "led bulb"],
        "standards": [
            ("IS 13252 (Part 1):2010", "high"),
            ("IS 616:2017", "high"),
            ("IS 16242:2014", "medium"),
            ("IS 16102 (Part 1):2012", "medium"),
            ("IS 16046 (Part 2):2018", "medium"),
        ],
        "explain": "Notified electronics and IT products need CRS registration to the applicable IS before sale in India.",
    },
    {
        "category": "Dairy & Edible Oils",
        "keywords": ["milk", "ghee", "paneer", "curd", "dairy", "mustard oil", "edible oil", "cooking oil", "milk powder", "toned milk"],
        "standards": [
            ("IS 13688:1992", "high"),
            ("IS 1362:2006", "high"),
            ("IS 1165:2002", "medium"),
        ],
        "explain": "Packaged milk, edible oils and milk powders follow dedicated food-grade specifications.",
    },
    {
        "category": "Furniture & Wood Products",
        "keywords": ["furniture", "chair", "table", "bed", "plywood", "board", "wooden", "door shutter"],
        "standards": [
            ("IS 17632 (Part 1):2022", "high"),
            ("IS 303:1989", "high"),
        ],
        "explain": "Wooden furniture and general-purpose plywood panels fall under mandatory QCO standards.",
    },
    {
        "category": "Paper, Stationery & Office Products",
        "keywords": ["paper", "a4", "copier", "notebook", "register", "exercise book", "stationery", "printing paper"],
        "standards": [
            ("IS 1848:2018", "high"),
            ("IS 5659:2019", "medium"),
        ],
        "explain": "Writing/printing papers and exercise notebooks follow dedicated paper specifications.",
    },
    {
        "category": "Chemicals & Fertilizers",
        "keywords": ["urea", "fertilizer", "caustic soda", "chemical", "dap", "npk", "sodium hydroxide", "acid"],
        "standards": [
            ("IS 11612:1986", "high"),
            ("IS 5625:1985", "medium"),
        ],
        "explain": "Fertilizer-grade urea and caustic soda follow dedicated chemical specifications.",
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
    best_score = 0.0
    for rule in RULES:
        score = 0.0
        for keyword in rule["keywords"]:
            if len(keyword) < 2:
                continue
            hits = hay.count(keyword)
            if not hits:
                continue
            # Multi-word phrases are strong category signals; weight by token count.
            score += hits * (2.0 if " " in keyword.strip() else 1.0 + 0.1 * len(keyword))
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
    best_rule, best_score = None, 0.0
    for rule in RULES:
        score = 0.0
        for k in rule["keywords"]:
            if len(k) < 2:
                continue
            hits = hay.count(k)
            if hits:
                score += hits * (2.0 if " " in k.strip() else 1.0 + 0.1 * len(k))
        if score > best_score:
            best_score, best_rule = score, rule
    return best_rule["category"] if best_rule and best_score > 0 else None