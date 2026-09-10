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
        "filename": "bis_certification_process_guide.md",
        "document_type": "process_guide",
        "title": "BIS Certification Process — Step-by-Step Guide (Domestic Manufacturer)",
        "sections": [
            {
                "page": 1,
                "section": "Step 1 — Identify the Applicable Standard",
                "content": (
                    "Before applying, confirm the exact Indian Standard (IS) that applies to "
                    "your product. Use the official 'Know Your Standard' service on bis.gov.in, "
                    "or check whether the product falls under the Compulsory Registration Scheme "
                    "(CRS) for electronics or the ISI Mark scheme for other goods. Products "
                    "under Quality Control Orders (QCOs) require mandatory certification before "
                    "sale in India."
                ),
            },
            {
                "page": 2,
                "section": "Step 2 — Prepare the Application",
                "content": (
                    "A domestic manufacturer files Form V through the BIS ManakOnline portal. "
                    "Required enclosures: factory registration / Udyam certificate, manufacturing "
                    "process flow chart, machinery list, in-house test facility details with "
                    "QC staff credentials, independent lab test reports and trademark "
                    "registration for the brand. Fees include an application fee and an "
                    "inspection-cum-testing charge payable at inspection."
                ),
            },
            {
                "page": 3,
                "section": "Step 3 — Testing and Factory Inspection",
                "content": (
                    "Samples are tested either at a BIS laboratory or an independent laboratory "
                    "recognised by BIS. A BIS officer then inspects the factory to verify "
                    "production capability, quality control setup and test facilities. The "
                    "simplified procedure allows licence grant on self-test plus third-party "
                    "test reports for units with strong in-house labs, without a pre-grant "
                    "factory visit."
                ),
            },
            {
                "page": 4,
                "section": "Step 4 — Licence Grant and Surveillance",
                "content": (
                    "After successful testing and inspection, a licence to use the Standard Mark "
                    "(ISI mark) is granted, typically 30-90 days after inspection for a well-"
                    "prepared unit. The licensee must mark every product with the ISI mark and "
                    "licence number (CM/L-xxxxxxx). BIS carries out surveillance: periodic "
                    "factory visits and market sample testing. Licence renewal is required "
                    "after the validity period with continued conformity evidence."
                ),
            },
            {
                "page": 5,
                "section": "Common Reasons for Rejection",
                "content": (
                    "Frequent rejection causes: wrong standard identified, missing in-house test "
                    "facility for the required parameters, incomplete process documentation, "
                    "no trademark for the brand, and failure of samples in independent testing. "
                    "Preparing the quality-control setup before applying prevents most delays."
                ),
            },
        ],
    },
    {
        "filename": "hallmarking_gold_jewellery_guide.md",
        "document_type": "sector_guidance",
        "title": "Hallmarking of Gold & Silver Jewellery — Consumer and Jeweller Guide",
        "sections": [
            {
                "page": 1,
                "section": "What Hallmarking Means",
                "content": (
                    "Hallmarking is the accurate determination and official recording of the "
                    "proportionate content of precious metal in jewellery. In India, the BIS "
                    "Hallmark consists of five marks: the BIS logo, purity/fineness grade "
                    "(e.g. 916 for 22-carat gold, 750 for 18-carat), the Assaying & Hallmarking "
                    "centre identification mark, the jeweller's identification mark and the "
                    "year-of-marking code letter."
                ),
            },
            {
                "page": 2,
                "section": "Consumer Checklist",
                "content": (
                    "When buying jewellery, check all five hallmark marks are present, verify the "
                    "purity grade stamped matches the billed purity, and retain the invoice. "
                    "Hallmarked jewellery can be tested at any BIS-recognised Assaying & "
                    "Hallmarking centre. Sale of gold jewellery without hallmarking is "
                    "restricted in notified districts under the mandatory hallmarking order."
                ),
            },
            {
                "page": 3,
                "section": "For Jewellers",
                "content": (
                    "A jeweller must obtain BIS registration to get articles hallmarked, send "
                    "articles only to BIS-recognised Assaying & Hallmarking centres, and maintain "
                    "records of articles hallmarked. Registration requires proof of business, "
                    "and compliance is monitored through BIS surveillance including test "
                    "purchases from the market."
                ),
            },
        ],
    },
    {
        "filename": "fmcs_imported_products_guide.md",
        "document_type": "scheme",
        "title": "Foreign Manufacturer Certification Scheme (FMCS) — Imported Products Guide",
        "sections": [
            {
                "page": 1,
                "section": "Who Needs FMCS",
                "content": (
                    "Foreign manufacturers whose products fall under mandatory BIS certification "
                    "— including steel, cement, tyres, pressure cookers, electrical appliances, "
                    "toys and chemicals covered by Quality Control Orders — must hold an FMCS "
                    "licence before their goods can be imported and sold in India. The licence "
                    "is held by the overseas factory, not the Indian importer, and each factory "
                    "location needs its own licence."
                ),
            },
            {
                "page": 2,
                "section": "FMCS Application Steps",
                "content": (
                    "FMCS steps: (1) nominate an Authorised Indian Representative, (2) submit the "
                    "factory, product and quality-system application to BIS, (3) host a BIS factory "
                    "inspection abroad, (4) pass independent sample testing to the applicable "
                    "Indian Standard, and (5) receive the CM/L licence to apply the ISI mark. "
                    "Consignments are checked at customs for a valid licence; unlicensed imports "
                    "can be seized under the BIS Act, 2016."
                ),
            },
            {
                "page": 3,
                "section": "Costs and Timelines",
                "content": (
                    "Indicative FMCS costs include an application fee, inspection and testing "
                    "charges including the foreign-visit expenses, an annual licence fee and a "
                    "marking fee per unit. Timelines commonly run 4-9 months depending on product "
                    "complexity and inspection scheduling. Verify current fees and timelines on "
                    "bis.gov.in before budgeting."
                ),
            },
        ],
    },
    {
        "filename": "bis_crs_electronics_guide.md",
        "document_type": "scheme",
        "title": "Compulsory Registration Scheme (CRS) for Electronics & IT Products",
        "sections": [
            {
                "page": 1,
                "section": "What CRS Covers",
                "content": (
                    "The Compulsory Registration Scheme (CRS), operated by BIS under MeitY "
                    "notifications, requires specified electronics and IT products — including "
                    "mobile phones, laptops, tablets, LED lamps, TVs, power adaptors, batteries, "
                    "CCTV cameras and smart watches — to be registered before sale in India. "
                    "Each product must be tested to its applicable Indian Standard such as "
                    "IS 13252 for IT equipment, IS 616 for audio-video apparatus, IS 16046 for "
                    "lithium cells and IS 16102 for LED lamps. The product must carry the CRS "
                    "registration mark with its R-number (e.g. R-41000000)."
                ),
            },
            {
                "page": 2,
                "section": "How to Register",
                "content": (
                    "Registration steps: (1) test samples at a BIS-recognised lab for the "
                    "notified standard, (2) create an account on the BIS CRS portal and file "
                    "the online application with test reports, (3) pay the registration and "
                    "processing fee, (4) receive the registration number after scrutiny, and "
                    "(5) mark every unit and renew before expiry. Foreign manufacturers apply "
                    "through an Authorised Indian Representative. Selling unregistered notified "
                    "electronics is prohibited and can attract enforcement action."
                ),
            },
        ],
    },
    {
        "filename": "qco_compliance_guide.md",
        "document_type": "process_guide",
        "title": "Quality Control Orders (QCOs) — What Manufacturers Must Know",
        "sections": [
            {
                "page": 1,
                "section": "What is a QCO",
                "content": (
                    "A Quality Control Order is a government notification that makes BIS "
                    "certification compulsory for specified products. Once a QCO is in force, "
                    "manufacturing, selling, distributing, importing or storing the notified "
                    "product without a valid BIS licence/registration is prohibited and "
                    "attracts penalties under the BIS Act, 2016."
                ),
            },
            {
                "page": 2,
                "section": "Compliance Roadmap",
                "content": (
                    "Typical roadmap for a manufacturer: (1) confirm the product and standard "
                    "notified under the QCO, (2) set up in-house testing for the standard's "
                    "essential parameters, (3) apply for the ISI mark licence or CRS "
                    "registration with test reports from a BIS-recognised lab, (4) receive "
                    "the licence before the QCO's effective date, and (5) maintain conformity "
                    "through surveillance. Imported goods need the foreign manufacturer "
                    "certification scheme (FMCS) licence held by the overseas producer."
                ),
            },
        ],
    },
    {
        "filename": "misc_queries_faq.md",
        "document_type": "faq",
        "title": "BIS Assistant FAQ — Fees, Complaints, Verification and Off-Topic Handling",
        "sections": [
            {
                "page": 1,
                "section": "Fees and Timelines",
                "content": (
                    "BIS fees depend on the scheme: ISI-mark licences involve an application fee, "
                    "inspection/testing charges, an annual licence fee and a marking fee, while CRS "
                    "registration charges a per-model registration and processing fee. Indicative "
                    "domestic ISI timelines run 1-4 months after testing and inspection; FMCS cases "
                    "commonly take 4-9 months. Always confirm the current fee schedule and timelines "
                    "on bis.gov.in or the Manakonline portal before paying any agent."
                ),
            },
            {
                "page": 2,
                "section": "Verify, Complain, Contact",
                "content": (
                    "Verify any ISI or hallmark claim on bis.gov.in through 'Verify Licence' or the "
                    "BIS Care app; never trust a printed mark alone. To complain about quality, "
                    "misuse of the ISI mark or an unlicensed seller, file a complaint on the BIS "
                    "complaint portal, the BIS Care app, or call toll-free 1800-11-3999. Keep the "
                    "invoice, photos of the mark and the licence number for faster resolution."
                ),
            },
            {
                "page": 3,
                "section": "Off-Topic and Small Talk",
                "content": (
                    "This assistant only answers questions about Indian Standards, BIS certification "
                    "(ISI mark, CRS, hallmarking, FMCS, QCOs), product compliance, testing, labelling "
                    "and BIS procedures. For greetings, thanks, price or job questions, or unrelated "
                    "topics like weather, movies, politics or homework, politely decline and redirect "
                    "the user to a BIS topic — for example: 'I can help with BIS standards, licences "
                    "and product checks. Which product or IS number should we look up?'"
                ),
            },
        ],
    },
    {
        "filename": "consumer_product_safety_checklist.md",
        "document_type": "sector_guidance",
        "title": "Consumer Product Safety Checklist — Before You Buy",
        "sections": [
            {
                "page": 1,
                "section": "Five-Point Check",
                "content": (
                    "Before buying a regulated product: (1) look for the ISI mark or the CRS "
                    "registration mark on the product and packaging, (2) check the licence "
                    "number format CM/L- followed by digits is present and legible, (3) verify "
                    "the licence number on the BIS portal's 'Verify Licence' service, "
                    "(4) confirm the marked standard number is appropriate for the product "
                    "type, and (5) check the manufacture date and expiry where applicable."
                ),
            },
            {
                "page": 2,
                "section": "Red Flags",
                "content": (
                    "Warning signs of counterfeit marking: blurred or hand-painted ISI marks, a "
                    "licence number that fails verification on the BIS portal, packaging that "
                    "omits manufacturer address, and prices far below market for certified "
                    "goods. Report suspected misuse of the Standard Mark to BIS through the "
                    "complaint portal or the toll-free helpline 1800-11-1333."
                ),
            },
        ],
    },
]