/**
 * Plain-language metadata for canonical lab names.
 * Provides friendly names, plain-English explanations, and emojis
 * so patients understand what each test measures without medical jargon.
 */

export type LabMeta = {
  /** Short friendly name shown as tile title instead of the raw canonical code */
  friendlyName: string;
  /** One-line plain-English description of what this test measures */
  whatItMeasures: string;
  /** Why it matters — what happens if too high or too low (plain language, no jargon) */
  whyItMatters: string;
  /** Emoji representing the body system or concept */
  emoji: string;
};

export const LAB_META: Record<string, LabMeta> = {
  // ── Glucose & HbA1c ──────────────────────────────────────────
  HbA1c: {
    friendlyName: "3-Month Sugar Average",
    whatItMeasures:
      "Shows the average level of sugar in your blood over the past 2–3 months, captured by measuring how much sugar has stuck to your red blood cells.",
    whyItMatters:
      "A higher number means your blood sugar has been running high. Doctors use this to check for diabetes or prediabetes. Keeping it in the target range lowers the risk of long-term complications.",
    emoji: "🍬",
  },
  Glucose: {
    friendlyName: "Blood Sugar",
    whatItMeasures:
      "The amount of sugar (glucose) in your blood right now, usually measured after fasting overnight.",
    whyItMatters:
      "Your body needs glucose for energy, but too much or too little causes problems. High fasting glucose can signal diabetes or prediabetes. Very low glucose is dangerous.",
    emoji: "🍬",
  },
  "Average Blood Glucose": {
    friendlyName: "Estimated Average Glucose",
    whatItMeasures:
      "An estimate of your average blood sugar over 2–3 months, calculated from your HbA1c result.",
    whyItMatters:
      "This helps you see the HbA1c number translated into everyday blood sugar terms. It's useful for understanding how tight your glucose control has been.",
    emoji: "🍬",
  },

  // ── Lipid Profile ────────────────────────────────────────────
  "Non-HDL Cholesterol": {
    friendlyName: "All Bad Cholesterol",
    whatItMeasures:
      "The total amount of cholesterol in your blood that is not the 'good' kind (HDL). It includes LDL and other harmful particles.",
    whyItMatters:
      "Non-HDL is sometimes a better marker of heart risk than LDL alone, because it counts more of the harmful particles. Lower is better.",
    emoji: "🫀",
  },
  VLDL: {
    friendlyName: "Very-Large Cholesterol Particles",
    whatItMeasures:
      "Very large particles carrying cholesterol and triglycerides through your blood, which can stick to artery walls.",
    whyItMatters:
      "VLDL is linked to heart disease risk. High levels often mean your triglycerides are also high. Lower is better.",
    emoji: "🫀",
  },
  "Total Cholesterol:HDL Ratio": {
    friendlyName: "Heart Health Ratio (Cholesterol)",
    whatItMeasures:
      "Compares your total cholesterol to your good cholesterol (HDL). The ratio shows how much of your cholesterol is 'bad' versus 'good'.",
    whyItMatters:
      "A lower ratio means your cholesterol balance is better for heart health. This ratio can be as important as the individual numbers.",
    emoji: "🫀",
  },
  "LDL:HDL Ratio": {
    friendlyName: "Heart Health Ratio (LDL vs Good)",
    whatItMeasures:
      "Compares your bad cholesterol (LDL) to your good cholesterol (HDL). Shows the balance between harmful and protective particles.",
    whyItMatters:
      "A lower ratio is protective for your heart and arteries. Some doctors watch this ratio as closely as the individual cholesterol numbers.",
    emoji: "🫀",
  },
  LDL: {
    friendlyName: "Bad Cholesterol",
    whatItMeasures:
      "Measures the cholesterol carried in particles that can stick to artery walls and narrow blood vessels over time.",
    whyItMatters:
      "Too much LDL can slowly clog your arteries, raising the risk of heart attack and stroke. Lower is generally better, especially if you have heart disease or diabetes.",
    emoji: "🫀",
  },
  HDL: {
    friendlyName: "Good Cholesterol",
    whatItMeasures:
      "Measures the cholesterol carried in particles that help clean your arteries and carry bad cholesterol away.",
    whyItMatters:
      "HDL acts like a cleaner — it carries cholesterol away from the arteries to the liver for removal. Higher levels are better and protect your heart.",
    emoji: "💚",
  },
  Triglycerides: {
    friendlyName: "Blood Fats",
    whatItMeasures:
      "The amount of fat in your blood used for energy. They come from food and are also made by your liver.",
    whyItMatters:
      "High triglycerides, especially if fasting, can raise heart disease risk and are linked to inflammation. Keeping them lower is usually better.",
    emoji: "🫀",
  },
  "Total Cholesterol": {
    friendlyName: "Total Cholesterol",
    whatItMeasures:
      "The sum of all cholesterol in your blood — HDL (good), LDL (bad), and VLDL (very bad) — plus triglycerides.",
    whyItMatters:
      "Total cholesterol is just one piece of the puzzle. It's more important to look at how it breaks down: more HDL and less LDL is better.",
    emoji: "🫀",
  },

  // ── Liver Function ───────────────────────────────────────────
  AST: {
    friendlyName: "Liver Stress Marker (AST)",
    whatItMeasures:
      "An enzyme found mainly in the liver and muscles. When liver cells are damaged, they leak this enzyme into the blood.",
    whyItMatters:
      "Elevated AST can signal liver inflammation, damage from alcohol, viral hepatitis, or other problems. Your doctor compares it to ALT to understand the pattern.",
    emoji: "🫘",
  },
  ALT: {
    friendlyName: "Liver Health Enzyme (ALT)",
    whatItMeasures:
      "An enzyme found mainly in the liver. When liver cells are stressed or damaged, ALT leaks into the bloodstream.",
    whyItMatters:
      "ALT is more specific to the liver than AST. Elevated ALT often points to liver inflammation or damage. It's one of the first signs something is wrong.",
    emoji: "🫘",
  },
  ALP: {
    friendlyName: "Bone & Liver Enzyme (ALP)",
    whatItMeasures:
      "An enzyme released by the liver, bones, and other tissues. High levels can indicate bone growth, liver stress, or blocked bile ducts.",
    whyItMatters:
      "High ALP can signal bone disease, pregnancy, liver problems, or biliary obstruction. Context matters — your doctor will interpret it with other clues.",
    emoji: "🫘",
  },
  GGT: {
    friendlyName: "Liver and Gallbladder Enzyme",
    whatItMeasures:
      "An enzyme found mainly in the liver and gallbladder. Elevated GGT often signals liver stress or bile duct problems.",
    whyItMatters:
      "High GGT can indicate alcohol-related liver damage, gallstones, or other liver problems. It's sensitive but not specific, so it's interpreted with other tests.",
    emoji: "🫘",
  },
  "Total Bilirubin": {
    friendlyName: "Total Bilirubin (Bile Pigment)",
    whatItMeasures:
      "The total amount of bilirubin in your blood — a yellow pigment from the breakdown of old red blood cells.",
    whyItMatters:
      "High bilirubin causes yellowing of the skin and eyes (jaundice) and can indicate liver disease, hemolysis, or blocked bile ducts. Your liver normally clears it quickly.",
    emoji: "🟡",
  },
  "Direct Bilirubin": {
    friendlyName: "Conjugated Bilirubin",
    whatItMeasures:
      "The part of bilirubin that has been processed by the liver and is ready to be excreted into bile.",
    whyItMatters:
      "High direct bilirubin suggests the liver has processed the pigment but cannot excrete it — pointing to liver or bile duct disease.",
    emoji: "🟡",
  },
  "Indirect Bilirubin": {
    friendlyName: "Unconjugated Bilirubin",
    whatItMeasures:
      "The part of bilirubin still waiting to be processed by the liver. High levels mean either too many red cells are breaking down or the liver cannot keep up.",
    whyItMatters:
      "Elevated indirect bilirubin suggests either rapid destruction of red cells (hemolysis) or a liver that cannot process pigment fast enough.",
    emoji: "🟡",
  },
  "Total Protein": {
    friendlyName: "Total Blood Protein",
    whatItMeasures:
      "The sum of all proteins in your blood, mainly albumin (made by the liver) and globulins (immune proteins).",
    whyItMatters:
      "Protein is essential for immunity, blood clotting, and maintaining fluid balance. Low total protein can signal malnutrition, liver disease, or kidney problems.",
    emoji: "🧬",
  },
  Albumin: {
    friendlyName: "Albumin (Main Blood Protein)",
    whatItMeasures:
      "The most abundant protein in blood, made by the liver. It carries nutrients, hormones, and drugs, and helps maintain fluid balance.",
    whyItMatters:
      "Low albumin can indicate liver disease, malnutrition, kidney disease, or inflammation. It develops slowly, so it reflects long-term nutritional status.",
    emoji: "🧬",
  },
  Globulin: {
    friendlyName: "Globulin (Immune Proteins)",
    whatItMeasures:
      "A group of proteins in blood that includes antibodies and other protective compounds made by immune cells.",
    whyItMatters:
      "High globulin can indicate infection, inflammation, or immune system disorders. Low globulin suggests immune problems.",
    emoji: "🛡️",
  },
  "A/G Ratio": {
    friendlyName: "Albumin-to-Globulin Ratio",
    whatItMeasures:
      "The ratio of albumin to globulin in your blood — shows the balance between the main blood protein and immune proteins.",
    whyItMatters:
      "This ratio helps assess nutritional status and liver function. A low ratio can indicate inflammation, chronic disease, or liver problems.",
    emoji: "🧬",
  },

  // ── Thyroid Profile ──────────────────────────────────────────
  TSH: {
    friendlyName: "Thyroid Controller Hormone",
    whatItMeasures:
      "A hormone from the pituitary gland that tells your thyroid gland to make more thyroid hormones (T3 and T4). It's the main signal controlling thyroid activity.",
    whyItMatters:
      "High TSH means your pituitary is pushing the thyroid to work harder, often because thyroid hormone levels are low. Low TSH means the thyroid is overactive. This is the first test doctors check for thyroid problems.",
    emoji: "🦋",
  },
  T3: {
    friendlyName: "T3 (Thyroid Hormone)",
    whatItMeasures:
      "One of the main hormones made by the thyroid gland. T3 is the more active form and controls metabolism and body heat.",
    whyItMatters:
      "T3 regulates how fast your metabolism runs. High levels can cause weight loss, anxiety, and heart palpitations. Low levels cause fatigue and sluggishness.",
    emoji: "🦋",
  },
  T4: {
    friendlyName: "T4 (Thyroid Hormone)",
    whatItMeasures:
      "The main hormone made by the thyroid. The body converts T4 to T3 (the more active form) as needed.",
    whyItMatters:
      "T4 is the storage form of thyroid hormone. It's usually measured as total T4 or free T4. Abnormal levels suggest thyroid disease.",
    emoji: "🦋",
  },
  "Free T3": {
    friendlyName: "Free T3 (Active Thyroid Hormone)",
    whatItMeasures:
      "The T3 hormone that is not bound to proteins — the form your cells can actually use.",
    whyItMatters:
      "Free T3 is the active form controlling metabolism. It's less commonly measured than TSH or T4, but important when thyroid symptoms don't match standard tests.",
    emoji: "🦋",
  },
  "Free T4": {
    friendlyName: "Free T4 (Active Thyroid Hormone)",
    whatItMeasures:
      "The T4 hormone not bound to proteins — the form your body can convert to active T3.",
    whyItMatters:
      "Free T4 is more relevant than total T4 because it represents the available hormone. It's the second test doctors check for thyroid problems (after TSH).",
    emoji: "🦋",
  },

  // ── Kidney Function & Electrolytes ───────────────────────────
  Creatinine: {
    friendlyName: "Muscle Waste (Kidney Filter)",
    whatItMeasures:
      "A waste product from muscle breakdown that is normally filtered by the kidneys and excreted in urine.",
    whyItMatters:
      "Elevated creatinine suggests kidneys are not filtering well. However, muscle mass, age, and sex affect interpretation — your doctor compares trends and other kidney tests.",
    emoji: "🫘",
  },
  Urea: {
    friendlyName: "Urea (Protein Waste)",
    whatItMeasures:
      "Nitrogen-containing waste produced by the liver when protein is broken down. Normally filtered by the kidneys.",
    whyItMatters:
      "High urea can indicate kidney disease, dehydration, or excessive protein breakdown. It's less specific than creatinine but provides additional clues about kidney function.",
    emoji: "🫘",
  },
  BUN: {
    friendlyName: "Blood Urea Nitrogen",
    whatItMeasures:
      "Nitrogen from urea waste in your blood. BUN reflects both kidney filtration and protein metabolism.",
    whyItMatters:
      "High BUN can indicate kidney disease, dehydration, or a high-protein diet. Low BUN is less common and can signal liver disease or malnutrition.",
    emoji: "🫘",
  },
  "BUN/Creatinine Ratio": {
    friendlyName: "BUN-to-Creatinine Ratio",
    whatItMeasures:
      "Compares BUN to creatinine. This ratio helps distinguish between kidney disease and dehydration or other causes of elevated waste.",
    whyItMatters:
      "A high ratio suggests dehydration or prerenal causes (before the kidneys). A low ratio suggests kidney disease itself. Your doctor uses this pattern to diagnose.",
    emoji: "🫘",
  },
  eGFR: {
    friendlyName: "Kidney Filtration Rate",
    whatItMeasures:
      "An estimate of how well your kidneys are filtering waste from your blood. Calculated from creatinine, age, sex, and race.",
    whyItMatters:
      "eGFR is the primary measure of kidney function. Above 60 is generally normal; below 60 suggests chronic kidney disease. Lower numbers mean kidneys are failing.",
    emoji: "🫘",
  },
  "Uric Acid": {
    friendlyName: "Uric Acid (Gout Risk)",
    whatItMeasures:
      "A waste product from the breakdown of purines (found in certain foods and in all cells). Normally excreted by the kidneys.",
    whyItMatters:
      "High uric acid can cause gout (painful joint inflammation) and kidney stones. It's also linked to heart disease. Certain foods and conditions raise uric acid.",
    emoji: "🦵",
  },
  Sodium: {
    friendlyName: "Sodium (Salt)",
    whatItMeasures:
      "The amount of sodium (salt) in your blood. Sodium is critical for nerve signals, muscle function, and fluid balance.",
    whyItMatters:
      "Abnormal sodium levels disrupt nerve and muscle function and can cause serious problems. Your kidneys and hormones tightly control sodium levels.",
    emoji: "🧂",
  },
  Potassium: {
    friendlyName: "Potassium",
    whatItMeasures:
      "The amount of potassium in your blood. Potassium is essential for heart rhythm and muscle function.",
    whyItMatters:
      "Too high or too low potassium is dangerous — both can cause heart arrhythmias and weakness. Kidney disease and some drugs affect potassium levels.",
    emoji: "🍌",
  },
  Chloride: {
    friendlyName: "Chloride",
    whatItMeasures:
      "An electrolyte that pairs with sodium to maintain fluid balance and acid-base balance in your blood.",
    whyItMatters:
      "Chloride levels closely follow sodium and are usually normal when sodium is normal. Abnormal chloride suggests dehydration, kidney disease, or metabolic problems.",
    emoji: "🧂",
  },

  // ── CBC ───────────────────────────────────────────────────────
  Hemoglobin: {
    friendlyName: "Oxygen Carrier in Blood",
    whatItMeasures:
      "The iron-containing protein in red blood cells that carries oxygen from your lungs to every cell in your body.",
    whyItMatters:
      "Low hemoglobin (anemia) means your blood cannot carry enough oxygen, causing fatigue and shortness of breath. High hemoglobin is rare and usually reflects dehydration.",
    emoji: "🩸",
  },
  RBC: {
    friendlyName: "Red Blood Cell Count",
    whatItMeasures:
      "The number of red blood cells in your blood. Red cells live about 120 days and carry oxygen.",
    whyItMatters:
      "Low RBC (anemia) reduces oxygen delivery, causing fatigue. High RBC (polycythemia) thickens the blood and raises stroke risk.",
    emoji: "🩸",
  },
  WBC: {
    friendlyName: "White Blood Cell Count",
    whatItMeasures:
      "The number of infection-fighting white blood cells in your blood. They patrol for invaders like bacteria and viruses.",
    whyItMatters:
      "High WBC suggests infection, inflammation, or (rarely) leukemia. Low WBC means your immune system may be weak, increasing infection risk.",
    emoji: "🛡️",
  },
  Platelets: {
    friendlyName: "Platelet Count (Clotting Cells)",
    whatItMeasures:
      "The number of tiny cell fragments that stick together to form blood clots and stop bleeding.",
    whyItMatters:
      "Low platelets increase bleeding and bruising risk. High platelets raise clot risk. Both extremes are concerning.",
    emoji: "🩸",
  },
  Hematocrit: {
    friendlyName: "Percentage of Red Blood Cells",
    whatItMeasures:
      "The percentage of your blood that is made up of red blood cells. The rest is mostly plasma (fluid).",
    whyItMatters:
      "Low hematocrit (anemia) reduces oxygen delivery. High hematocrit (dehydration or polycythemia) thickens the blood. It follows hemoglobin patterns closely.",
    emoji: "🩸",
  },
  MCV: {
    friendlyName: "Red Blood Cell Size",
    whatItMeasures:
      "The average size of your red blood cells. Large cells are less efficient at carrying oxygen.",
    whyItMatters:
      "High MCV (macrocytic) often indicates B12 or folate deficiency. Low MCV (microcytic) suggests iron deficiency or thalassemia.",
    emoji: "🔬",
  },
  MCH: {
    friendlyName: "Hemoglobin per Red Cell",
    whatItMeasures:
      "The average amount of hemoglobin in each red blood cell.",
    whyItMatters:
      "Low MCH usually means iron deficiency or thalassemia. High MCH is less common and may indicate B12 or folate deficiency.",
    emoji: "🔬",
  },
  MCHC: {
    friendlyName: "Hemoglobin Concentration in Red Cells",
    whatItMeasures:
      "The average concentration of hemoglobin in red blood cells. Shows how saturated the cells are with hemoglobin.",
    whyItMatters:
      "MCHC is usually stable unless you have iron deficiency anemia. It's less often used than MCV or MCH for diagnosis.",
    emoji: "🔬",
  },
  RDW: {
    friendlyName: "Red Cell Size Variation",
    whatItMeasures:
      "Measures how different your red blood cells are in size. High RDW means cells vary wildly.",
    whyItMatters:
      "High RDW suggests anemia from B12, folate, or iron deficiency, where new and old cells coexist. It can appear before hemoglobin drops.",
    emoji: "🔬",
  },
  MPV: {
    friendlyName: "Platelet Size",
    whatItMeasures:
      "The average size of your platelets. Larger platelets are often younger and more active.",
    whyItMatters:
      "High MPV can indicate bone marrow is stressed and releasing young platelets. Low MPV may suggest bone marrow failure.",
    emoji: "🔬",
  },
  Neutrophils: {
    friendlyName: "Neutrophil Count (Front-Line Immune)",
    whatItMeasures:
      "The number of neutrophils, a type of white blood cell that is the first responder to infection and inflammation.",
    whyItMatters:
      "High neutrophils suggest acute infection or inflammation. Low neutrophils raise serious infection risk. This is the most common type of white cell.",
    emoji: "🛡️",
  },
  Lymphocytes: {
    friendlyName: "Lymphocyte Count (Smart Immune)",
    whatItMeasures:
      "The number of lymphocytes, white blood cells that remember infections and produce antibodies.",
    whyItMatters:
      "Low lymphocytes can indicate HIV, weakened immunity, or cancer treatment. High lymphocytes suggest viral infection or leukemia.",
    emoji: "🛡️",
  },
  Monocytes: {
    friendlyName: "Monocyte Count (Cleanup Crew)",
    whatItMeasures:
      "The number of monocytes, large white blood cells that eat debris, dead cells, and invaders.",
    whyItMatters:
      "High monocytes suggest chronic infection, inflammation, or leukemia. Monocytes are often elevated in tuberculosis or fungal infections.",
    emoji: "🛡️",
  },
  Eosinophils: {
    friendlyName: "Eosinophil Count (Allergy & Parasite)",
    whatItMeasures:
      "The number of eosinophils, white blood cells that fight allergic reactions and parasite infections.",
    whyItMatters:
      "High eosinophils usually indicate allergy, asthma, or parasites. Can also suggest certain cancers or drug reactions.",
    emoji: "🛡️",
  },
  Basophils: {
    friendlyName: "Basophil Count (Allergy Messenger)",
    whatItMeasures:
      "The number of basophils, rare white blood cells that release histamine during allergic reactions.",
    whyItMatters:
      "Basophils are usually very low. Elevated basophils are rare but can indicate leukemia or severe allergy.",
    emoji: "🛡️",
  },
  ESR: {
    friendlyName: "Inflammation Marker (ESR)",
    whatItMeasures:
      "How fast red blood cells fall through blood serum. Inflammation makes cells fall faster.",
    whyItMatters:
      "High ESR indicates inflammation somewhere in the body — from infection, autoimmune disease, cancer, or even normal aging. It's nonspecific but useful alongside other tests.",
    emoji: "🔥",
  },

  // ── Minerals ─────────────────────────────────────────────────
  Calcium: {
    friendlyName: "Calcium (Bone & Nerve)",
    whatItMeasures:
      "The amount of calcium in your blood. Calcium is essential for strong bones, muscle contraction, and nerve signals.",
    whyItMatters:
      "Low calcium (hypocalcemia) causes weakness and muscle cramps. High calcium (hypercalcemia) can damage kidneys and heart. Calcium is tightly controlled by hormones.",
    emoji: "🦴",
  },
  Phosphorus: {
    friendlyName: "Phosphorus",
    whatItMeasures:
      "The amount of phosphorus in your blood. Phosphorus works with calcium to build and maintain bones.",
    whyItMatters:
      "Phosphorus is tightly linked to calcium and kidney function. Imbalances occur in kidney disease and can cause bone and heart problems.",
    emoji: "🦴",
  },
  Magnesium: {
    friendlyName: "Magnesium",
    whatItMeasures:
      "The amount of magnesium in your blood. Magnesium is essential for muscle and nerve function, and energy production.",
    whyItMatters:
      "Low magnesium (hypomagnesemia) causes muscle cramps, weakness, and irregular heartbeat. It's common with diarrhea or certain drugs.",
    emoji: "⚡",
  },

  // ── Iron Studies ─────────────────────────────────────────────
  Iron: {
    friendlyName: "Serum Iron",
    whatItMeasures:
      "The amount of iron dissolved in blood plasma. Iron is transported to cells to make hemoglobin and other proteins.",
    whyItMatters:
      "Low iron causes anemia (weak blood). High iron (iron overload) can damage the liver and heart. Iron levels vary throughout the day, so they're usually compared to iron-binding capacity.",
    emoji: "🔧",
  },
  TIBC: {
    friendlyName: "Iron-Carrying Capacity",
    whatItMeasures:
      "The maximum amount of iron that blood can carry. It reflects the amount of transferrin (the iron-transport protein).",
    whyItMatters:
      "High TIBC suggests iron deficiency (your body is making more carrier protein to grab more iron). Low TIBC can indicate iron overload or malnutrition.",
    emoji: "🔧",
  },
  UIBC: {
    friendlyName: "Unused Iron-Carrying Capacity",
    whatItMeasures:
      "The amount of iron-carrying capacity not yet filled with iron. It's calculated from serum iron and TIBC.",
    whyItMatters:
      "High UIBC suggests iron deficiency. Low UIBC suggests iron overload. It helps distinguish iron deficiency from other causes of anemia.",
    emoji: "🔧",
  },
  Transferrin: {
    friendlyName: "Iron Transport Protein",
    whatItMeasures:
      "The protein in blood that binds and transports iron from the intestines and stores throughout the body.",
    whyItMatters:
      "High transferrin suggests iron deficiency (your body made more protein to grab scarce iron). Low transferrin can indicate liver disease or iron overload.",
    emoji: "🔧",
  },
  "Iron Saturation": {
    friendlyName: "Iron Saturation (%)",
    whatItMeasures:
      "The percentage of iron-carrying capacity that is actually filled with iron (serum iron divided by TIBC).",
    whyItMatters:
      "Low iron saturation suggests deficiency. High iron saturation suggests overload or hemochromatosis. This percentage is key to diagnosing iron disorders.",
    emoji: "🔧",
  },
  Ferritin: {
    friendlyName: "Iron Storage Indicator",
    whatItMeasures:
      "The amount of ferritin in blood — a protein that stores iron inside cells. Blood ferritin reflects total iron stores in the body.",
    whyItMatters:
      "Low ferritin indicates iron deficiency (depleted stores). High ferritin suggests iron overload, but can also be elevated by inflammation, liver disease, or cancer.",
    emoji: "🔧",
  },

  // ── Vitamins ─────────────────────────────────────────────────
  "Vitamin D": {
    friendlyName: "Vitamin D (Sunshine Vitamin)",
    whatItMeasures:
      "The amount of vitamin D in your blood (measured as 25-hydroxy vitamin D). Vitamin D is made in the skin with sunlight and supports bone and immune health.",
    whyItMatters:
      "Low vitamin D weakens bones and may impair immunity. High vitamin D is rare but can cause calcium imbalances. Most adults need 1000–4000 IU daily.",
    emoji: "☀️",
  },
  "Vitamin B12": {
    friendlyName: "Vitamin B12 (Energy & Nerve)",
    whatItMeasures:
      "The amount of B12 in your blood. B12 is essential for red blood cell formation, nerve function, and energy metabolism.",
    whyItMatters:
      "Low B12 causes pernicious anemia, fatigue, and nerve damage if severe. B12 is found mainly in animal products; vegans need supplements or injections.",
    emoji: "🔋",
  },
  Folate: {
    friendlyName: "Folate (B Vitamin)",
    whatItMeasures:
      "The amount of folate (folic acid) in your blood. Folate is essential for DNA synthesis and red blood cell formation.",
    whyItMatters:
      "Low folate causes anemia and increases birth defect risk in pregnancy. Leafy greens and legumes are good sources. Certain medications deplete folate.",
    emoji: "🥬",
  },

  // ── Cardiac ──────────────────────────────────────────────────
  "hs-CRP": {
    friendlyName: "Heart Inflammation Marker",
    whatItMeasures:
      "High-sensitivity C-reactive protein — a marker of inflammation in the body, particularly in blood vessels.",
    whyItMatters:
      "Elevated hs-CRP is associated with heart attack and stroke risk, independent of cholesterol. It helps identify people at higher cardiovascular risk.",
    emoji: "🫀",
  },
  CRP: {
    friendlyName: "Inflammation Marker",
    whatItMeasures:
      "C-reactive protein — rises when your body is inflamed, usually from infection or autoimmune disease.",
    whyItMatters:
      "High CRP indicates acute inflammation or infection. It's less specific than hs-CRP for heart disease but useful in diagnosis.",
    emoji: "🔥",
  },
  Homocysteine: {
    friendlyName: "Amino Acid (Heart Risk)",
    whatItMeasures:
      "An amino acid in blood that, when high, is linked to increased risk of heart disease and stroke.",
    whyItMatters:
      "Elevated homocysteine damages artery walls and increases clot risk. It's associated with low B12, folate, and B6. Some genetic factors raise homocysteine.",
    emoji: "🫀",
  },
  "Lipoprotein(a)": {
    friendlyName: "Lipoprotein(a) (Heart Risk)",
    whatItMeasures:
      "A type of cholesterol particle linked to heart disease and stroke. Lipoprotein(a) levels are largely genetic.",
    whyItMatters:
      "High Lp(a) significantly raises cardiovascular risk, especially if you also have high LDL or other risk factors. It's mostly genetic, so if high, more aggressive cholesterol control is recommended.",
    emoji: "🫀",
  },
  "Apolipoprotein B": {
    friendlyName: "Apo B (Particle Count)",
    whatItMeasures:
      "The number of harmful cholesterol particles in your blood. Each particle contains one Apo B, so Apo B is a direct count of harmful particles.",
    whyItMatters:
      "Some cardiologists believe Apo B is a better marker than LDL cholesterol for heart disease risk, because it counts all harmful particles.",
    emoji: "🫀",
  },
  "Apolipoprotein A1": {
    friendlyName: "Apo A1 (Good Particle Count)",
    whatItMeasures:
      "The main protein in HDL (good cholesterol) particles. High Apo A1 indicates more protective particles.",
    whyItMatters:
      "High Apo A1 is associated with heart protection. Low Apo A1 suggests inadequate HDL particles and higher cardiovascular risk.",
    emoji: "💚",
  },

  // ── Pancreas ─────────────────────────────────────────────────
  Lipase: {
    friendlyName: "Pancreas Enzyme (Lipase)",
    whatItMeasures:
      "An enzyme made by the pancreas that breaks down dietary fats in the intestines.",
    whyItMatters:
      "Elevated lipase strongly suggests pancreatic inflammation (pancreatitis), often from gallstones or alcohol. It's more specific for pancreatic problems than amylase.",
    emoji: "🔥",
  },
  Amylase: {
    friendlyName: "Starch-Digesting Enzyme",
    whatItMeasures:
      "An enzyme from the pancreas and salivary glands that breaks down starch into sugars.",
    whyItMatters:
      "Elevated amylase suggests pancreatitis, but it's less specific than lipase because it comes from multiple sources. Your doctor combines it with other clues.",
    emoji: "🔥",
  },

  // ── Urine ────────────────────────────────────────────────────
  "Urine pH": {
    friendlyName: "Urine Acidity",
    whatItMeasures:
      "How acidic or alkaline your urine is on a scale of 0–14 (7 is neutral).",
    whyItMatters:
      "Abnormal urine pH can indicate infection (alkaline), kidney stone risk, or metabolic problems. Diet and medications affect urine pH.",
    emoji: "💧",
  },
  "Urine Specific Gravity": {
    friendlyName: "Urine Concentration",
    whatItMeasures:
      "How concentrated your urine is compared to water. Higher values mean more dissolved substances.",
    whyItMatters:
      "High specific gravity suggests dehydration. Low specific gravity suggests overhydration or kidney problems. It reflects your hydration status.",
    emoji: "💧",
  },
  "Urine Protein": {
    friendlyName: "Protein in Urine",
    whatItMeasures:
      "The amount of protein leaking into your urine. Normally, the kidneys keep proteins in blood.",
    whyItMatters:
      "Protein in urine (proteinuria) is a warning sign of kidney disease, diabetes, or high blood pressure. It requires investigation.",
    emoji: "💧",
  },
  "Urine Glucose": {
    friendlyName: "Glucose in Urine",
    whatItMeasures:
      "The amount of sugar leaking into your urine. Normally, kidneys reabsorb all glucose.",
    whyItMatters:
      "Glucose in urine suggests either very high blood sugar (diabetes) or a kidney problem preventing reabsorption. It's a red flag for diabetes.",
    emoji: "💧",
  },
};

export function getLabMeta(canonicalName: string): LabMeta | null {
  return LAB_META[canonicalName] ?? null;
}
