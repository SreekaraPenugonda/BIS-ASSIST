"""Bundled sample source documents used to demonstrate the RAG pipeline.

Each document is a *synthetic, summarised excerpt* in the style of a BIS
standard publication — included so the retrieval/citation flow can be demoed
end-to-end (and indexed as PDF-equivalent text) without shipping copyrighted
BIS material. Production deployments should ingest actual BIS publications
under the applicable licensing/usage policy.
"""

SAMPLE_DOCUMENTS: list[dict] = [
    {
        "filename": "IS_10500_drinking_water_summary.md",
        "document_type": "standard",
        "title": "Drinking Water — Specification (IS 10500)",
        "sections": [
            {
                "page": 1,
                "section": "Scope",
                "content": (
                    "IS 10500 prescribes the acceptable and permissible limits for the "
                    "physical, chemical, bacteriological and organoleptic parameters of "
                    "drinking water. The standard is used across India for testing water "
                    "quality in domestic supply, packaged drinking water plants and "
                    "community water systems. Organoleptic parameters cover colour, odour "
                    "and taste; physical parameters include turbidity and total dissolved "
                    "solids. Certain limits are marked 'relaxable' with the consent of the "
                    "authority if no alternative source is available."
                ),
            },
            {
                "page": 2,
                "section": "Key Requirements",
                "content": (
                    "Bacteriological requirement: coliform bacteria shall not be detectable "
                    "in 100 ml of the sample. Chemical limits cover pH, total hardness, "
                    "chlorides, sulphates and heavy metals such as lead, arsenic, cadmium "
                    "and mercury. The standard defines acceptable limits (for normal supply) "
                    "and permissible limits (in the absence of an alternative source). "
                    "Test methods referenced include the standard methods for examination "
                    "of water and wastewater."
                ),
            },
            {
                "page": 3,
                "section": "Testing & Compliance",
                "content": (
                    "Sampling shall be carried out from the point of consumption, not only "
                    "from the distribution network. The full analytical schedule covers "
                    "more than fifty parameters. Continuous supply systems require "
                    "residual free chlorine verification where chlorination is practised. "
                    "Results are compared with Table 1 (acceptable) and Table 2 "
                    "(permissible in the absence of alternative source)."
                ),
            },
        ],
    },
    {
        "filename": "IS_302_household_appliances_safety_summary.md",
        "document_type": "standard",
        "title": "Safety of Household Electrical Appliances (IS 302 family)",
        "sections": [
            {
                "page": 1,
                "section": "Scope",
                "content": (
                    "The IS 302 series specifies safety requirements for household and "
                    "similar electrical appliances to protect users against electric shock, "
                    "thermal hazards and mechanical hazards. Part 2-1 states general "
                    "requirements; the Part 2-x sub-standards add requirements for "
                    "particular appliance categories such as washing machines (2-11) and "
                    "heating appliances for liquids (2-15)."
                ),
            },
            {
                "page": 2,
                "section": "Key Requirements",
                "content": (
                    "Appliances are assessed for insulation, earthing continuity, touch "
                    "current and abnormal operation. Heating circuits require over-"
                    "temperature protection and boil-dry cut-offs. Where relevant, "
                    "electromagnetic compatibility is verified. Marking must include rated "
                    "voltage, frequency, power rating, and the manufacturer's identity. "
                    "Appliances under compulsory certification must carry the Standard Mark "
                    "(ISI mark) only through licensed manufacturers."
                ),
            },
            {
                "page": 3,
                "section": "Compliance & Testing",
                "content": (
                    "Type tests are performed on samples drawn by the certification body. "
                    "Surveillance testing of marked product is carried out from the "
                    "market. Compliance with the series is demonstrated by successful "
                    "completion of the prescribed test schedule in a recognised "
                    "laboratory. The scope of each Part 2-x standard lists the appliance "
                    "categories and exclusions."
                ),
            },
        ],
    },
    {
        "filename": "BIS_certification_marks_scheme_overview.md",
        "document_type": "scheme",
        "title": "BIS Certification Marks Scheme — Overview (Standard Mark)",
        "sections": [
            {
                "page": 1,
                "section": "Purpose",
                "content": (
                    "The BIS Certification Marks Scheme operates under the Bureau of Indian "
                    "Standards Act and provides third-party assurance of product quality "
                    "to Indian Standards. Manufacturers whose products conform to the "
                    "relevant standard may apply for a licence to use the Standard Mark "
                    "(commonly called the ISI mark). The mark signals conformity of the "
                    "product with the applicable Indian Standard at the time of testing."
                ),
            },
            {
                "page": 2,
                "section": "Application Process",
                "content": (
                    "A manufacturer applies with details of the product, plant, test "
                    "facilities and quality control system. The application is reviewed, "
                    "samples are drawn and tested in an independent laboratory, and a "
                    "pre-inspection of the manufacturing unit is conducted. On successful "
                    "completion the licence is granted with conditions, including annual "
                    "renewal. Schemes differ by product sector; some products fall under "
                    "Compulsory Certification (schedule of Indian Standards)."
                ),
            },
            {
                "page": 3,
                "section": "After the Licence",
                "content": (
                    "Licensed units are subject to surveillance visits and market "
                    "surveillance testing. The licence can be suspended or cancelled for "
                    "non-conformity. Consumers can verify the mark; misuse of the mark is "
                    "an offence under the Act. BIS also operates a Laboratory Recognition "
                    "Scheme, Hallmarking for precious metals and a Consumers' Grievance "
                    "redressal mechanism."
                ),
            },
        ],
    },
    {
        "filename": "agriculture_power_tiller_safety_summary.md",
        "document_type": "sector_guidance",
        "title": "Agriculture Equipment — Power Tiller Safety",
        "sections": [
            {"page": 1, "section": "Scope", "content": "Agricultural power tillers require safe guarding, stable operation, clear controls and suitable operator information. The applicable standard and current regulatory order must be confirmed for the exact machine and use case."},
            {"page": 2, "section": "Checks", "content": "Review moving-part guards, emergency stopping, stability, noise and vibration, fuel or electrical safety, warning labels and maintenance instructions before placing equipment into service."},
        ],
    },
    {
        "filename": "textiles_apparel_care_labelling_summary.md",
        "document_type": "sector_guidance",
        "title": "Textiles & Apparel — Care Labelling",
        "sections": [
            {"page": 1, "section": "Scope", "content": "Textile apparel labels should provide durable, readable care instructions for washing, bleaching, drying, ironing and professional care. Fibre information and manufacturer details should be considered separately under applicable requirements."},
            {"page": 2, "section": "Consumer Information", "content": "Care symbols should match the garment construction and materials. Labels must not make care claims that could cause avoidable damage or mislead consumers."},
        ],
    },
    {
        "filename": "mobile_phone_safety_summary.md",
        "document_type": "sector_guidance",
        "title": "Information Technology — Mobile Phone Safety",
        "sections": [
            {"page": 1, "section": "Scope", "content": "Mobile phones and chargers should be assessed for electrical safety, battery protection, charging behaviour, marking and abnormal operation. The applicable CRS notification and current product scope must be checked before sale."},
            {"page": 2, "section": "Verification", "content": "Verify the model, manufacturer, registration status, charger compatibility and product markings through the official BIS and government portals. A label or QR code alone does not prove current registration."},
        ],
    },
    {
        "filename": "compostable_plastics_environment_summary.md",
        "document_type": "sector_guidance",
        "title": "Environment — Compostable Plastic Products",
        "sections": [
            {"page": 1, "section": "Scope", "content": "Compostable product claims should be supported by evidence for disintegration and biodegradation under specified conditions. Claims must identify the relevant disposal conditions and avoid implying that every environment will compost the product."},
            {"page": 2, "section": "Marking", "content": "Manufacturers should maintain material traceability, test records and clear disposal instructions. Confirm the latest environmental rules and authority requirements before placing a product on the market."},
        ],
    },
    {
        "filename": "sewage_treatment_sanitation_summary.md",
        "document_type": "sector_guidance",
        "title": "Water & Sanitation — Sewage Treatment",
        "sections": [
            {"page": 1, "section": "Scope", "content": "Sewage treatment facilities should define incoming load, treatment stages, effluent targets, monitoring responsibilities and safe sludge handling. Design approval and discharge requirements depend on the authority and location."},
            {"page": 2, "section": "Operations", "content": "Keep operating logs, sampling records, maintenance schedules and incident reports. Effluent results must be compared with the current consent conditions and applicable standards."},
        ],
    },
    {
        "filename": "food_packaging_materials_summary.md",
        "document_type": "sector_guidance",
        "title": "Packaging — Food Contact Materials",
        "sections": [
            {"page": 1, "section": "Scope", "content": "Food packaging requires material suitability, hygienic manufacture, closure integrity and traceability. The intended food type, temperature, contact time and reuse conditions affect the applicable checks."},
            {"page": 2, "section": "Records", "content": "Maintain declarations, batch records, supplier specifications and test reports. Confirm current food-safety rules and applicable Indian Standards for the exact packaging material."},
        ],
    },
]