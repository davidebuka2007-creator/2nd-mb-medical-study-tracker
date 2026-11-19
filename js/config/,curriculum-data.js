/* 2ndMBstudy — Official 2nd MBBS Curriculum & Course Drive Folders */
/* Preserves official syllabus wording & unique topic IDs without inventing topics. */

const RAW_SECTIONS = [
  // =========================================================================
  // 1ST SEMESTER
  // =========================================================================
  {
    id: 's1-ana-emb',
    semester: 1,
    semesterLabel: '1st Semester',
    subject: 'Anatomy',
    department: 'Embryology',
    sectionTitle: '1st Semester · Embryology',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1Z86LchZFtIFJMyEjbjXy3dOhn-yNtrHG',
    topics: [
      'Introduction, Testis, Spermatogenesis',
      'Ovary and Oogenesis',
      'Female Reproductive Cycles',
      'Fertilization',
      'Cleavage, Blastocyst Formation and Implantation',
      'Bilaminar Germ Disc (Wk.2)',
      'Trilaminar Germ Disc (Wk.3)',
      'Early Embryogenesis / Embryonic Period (Wk.3 - 8)',
      'Late Embryogenesis / Fetal Period (Wk.9 - Birth / 3rd Month - Birth)',
      'Placenta',
      'Development of the Larynx, Trachea and Lung',
      'Development of the Heart I',
      'Development of the Heart II',
      'Development of the Heart III'
    ]
  },
  {
    id: 's1-ana-gross-upper',
    semester: 1,
    semesterLabel: '1st Semester',
    subject: 'Anatomy',
    department: 'Gross Anatomy',
    sectionTitle: '1st Semester · Gross Anatomy · Upper Limb',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1cz9-vVEyR3dXNtkBh3YiV_Sd-ndsgtH9',
    topics: [
      'Anatomical Positions, Terms, Movements, ETC',
      'Introduction to Upper Limb / Bones of Upper Limbs',
      'Pectoral Region',
      'Mammary Glands',
      'Axilla',
      'Brachial Plexus',
      'Back of the Body & Scapular Region / Shoulder Region',
      'Classification of Joints',
      'Shoulder Joint',
      'Anatomy of The Arm',
      'Classification of Bones',
      'The Forearm (Flexor Compartment)',
      'The Forearm (Extensor Compartment)',
      'Palm of Hand',
      'Dorsum of Hand',
      'Major Nerves (Musculocutaneous, Axillary, Radial, Median, Ulnar)',
      'Elbow Joint',
      'Radio-Ulnar Joint',
      'Wrist Joint (Colles Fracture)',
      'Arteries of Upper Limb / Anastomoses (Shoulder, Elbow, Wrist)',
      'Venous Drainage of Upper Limb',
      'Lymphatic Drainage of the Upper Limb',
      'Cutaneous & Segmental Innervation of Upper Limb'
    ]
  },
  {
    id: 's1-ana-gross-thorax',
    semester: 1,
    semesterLabel: '1st Semester',
    subject: 'Anatomy',
    department: 'Gross Anatomy',
    sectionTitle: '1st Semester · Gross Anatomy · Thorax',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1czY05pMw3CagYVTSU4YDImdCRqfOBDsj',
    topics: [
      'Intro to Thorax / Thoracic Cage',
      'Bones and Joints of The Thorax',
      'Thoracic Wall / Intercostal Nerves & Vessels / Respiration',
      'Pleura',
      'Lungs',
      'Mediastinum',
      'Pericardium & Heart (Borders, Surfaces & Blood Supply)',
      'The Oesophagus',
      'Thoracic Duct, Azygos Vein and Hemiazygous Vein',
      'Thoracic Part of Autonomic Nervous System'
    ]
  },
  {
    id: 's1-ana-histo',
    semester: 1,
    semesterLabel: '1st Semester',
    subject: 'Anatomy',
    department: 'Histology',
    sectionTitle: '1st Semester · Histology',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1Z4MaF5w8XfnaH-WDQc_ejcQhQSCGNlsV',
    topics: [
      'Introduction, Histotechniques',
      'Protective and Glandular Epithelium',
      'Fibrous Connective Tissue',
      'Cartilage',
      'Bone, Bone Formation',
      'Muscle Tissue',
      'Nervous Tissue (Fibres, Cells, Ganglion)',
      'Blood and Lymphatic Vessels',
      'Trachea, Lung',
      'Lymph Node, Tonsil, Thymus, Spleen',
      'Skin',
      'Lip, Tongue, Tooth',
      'Salivary Glands, Oesophagus'
    ]
  },
  {
    id: 's1-phys-general',
    semester: 1,
    semesterLabel: '1st Semester',
    subject: 'Physiology',
    department: 'General Physiology',
    sectionTitle: '1st Semester · General Physiology',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1eblRxPscxmjM9AMN2Eh1cLeu4At7XFvu',
    topics: [
      'Introduction',
      'Homeostasis and Control Systems',
      'Cell Structure and Functions',
      'Transport Across Cell Membrane',
      'Temperature Regulation',
      'Control of Protein Synthesis & Protein Function'
    ]
  },
  {
    id: 's1-phys-blood',
    semester: 1,
    semesterLabel: '1st Semester',
    subject: 'Physiology',
    department: 'Blood Physiology',
    sectionTitle: '1st Semester · Blood Physiology',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1efA1W25DWCasCQ6jF3qpgf40Uct9YMDS',
    topics: [
      'Blood Intro and Hematopoiesis',
      'Red Blood Cell',
      'Hemoglobin, Bilirubin and Jaundice',
      'Anemia',
      'Blood Groups and Rhesus Factor',
      'Immunity',
      'White Blood Cell',
      'Blood Plasma Components',
      'Hemostasis'
    ]
  },
  {
    id: 's1-phys-excitables',
    semester: 1,
    semesterLabel: '1st Semester',
    subject: 'Physiology',
    department: 'Excitable Physiology',
    sectionTitle: '1st Semester · Excitable Physiology',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1mCCWsF9y-3U1IbJzwZ2jy_aH8rAy9htt',
    topics: [
      'Structure of a Neuron',
      'Membrane Potentials (RMP & AP)',
      'Stimulus-Response Characteristics',
      'Neuromuscular Transmission',
      'Neuronal or Central Synaptic Transmission',
      'Skeletal Muscle',
      'Cardiac Muscle',
      'Smooth Muscle',
      'Autonomic Nervous System'
    ]
  },
  {
    id: 's1-bch-carb',
    semester: 1,
    semesterLabel: '1st Semester',
    subject: 'Biochemistry',
    department: 'Carbohydrate',
    sectionTitle: '1st Semester · Biochemistry · Carbohydrate',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1_w_qTuhQoEIchhlZTzBTlaXXDGwzemxJ',
    topics: [
      'Introduction to Biochemistry',
      "CHO's Introduction; Definition and Functions",
      'Classification, Nomenclature',
      'Description of Monosaccharides',
      'Disaccharides',
      'Oligosaccharides',
      'Polysaccharides with Examples',
      'Stereochemistry',
      'Reducing and Non-Reducing Sugars',
      'Complex Carbohydrates / Polysaccharides',
      'Common Chemical Reactions of Some Carbs (Tests)'
    ]
  },
  {
    id: 's1-bch-lipids',
    semester: 1,
    semesterLabel: '1st Semester',
    subject: 'Biochemistry',
    department: 'Lipids and Biomembrane',
    sectionTitle: '1st Semester · Biochemistry · Lipids and Biomembrane',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1_w_qTuhQoEIchhlZTzBTlaXXDGwzemxJ',
    topics: [
      'Lipids Introduction, Biomedical Importance',
      'Classification of Lipids',
      'Fatty Acids',
      'Simple Lipids; Neutral Fats (TAGS), Waxes etc',
      'Compound/Complex Lipids (Phospholipids, Glycolipids, Steroids)',
      'Properties of Fatty Acids',
      'Lipids and Obesity, Diabetes, CVS Disease, Atherosclerosis, Fatty Liver',
      'Biological Cell Membrane'
    ]
  },
  {
    id: 's1-bch-aa',
    semester: 1,
    semesterLabel: '1st Semester',
    subject: 'Biochemistry',
    department: 'Amino Acids',
    sectionTitle: '1st Semester · Biochemistry · Amino Acids',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1_w_qTuhQoEIchhlZTzBTlaXXDGwzemxJ',
    topics: [
      'Acid-Base Theory',
      'Buffers',
      'Intro to Amino Acids',
      'Classification of AA Based on Side Chain',
      'Classification of AA Based on Nutrition, Metabolic Fate & Structure',
      'Derived Amino Acids',
      'Physical/Chemical Properties of Amino Acids',
      'General Reactions of AA',
      'Quantitative Determination of AA (Tests)'
    ]
  },
  {
    id: 's1-bch-proteins',
    semester: 1,
    semesterLabel: '1st Semester',
    subject: 'Biochemistry',
    department: 'Proteins',
    sectionTitle: '1st Semester · Biochemistry · Proteins',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1_w_qTuhQoEIchhlZTzBTlaXXDGwzemxJ',
    topics: [
      'Levels of Protein',
      'Classifications of Protein',
      'Qualitative Analysis of Amino Acids & Proteins',
      'Protein Sequencing'
    ]
  },
  {
    id: 's1-bch-nucleotides',
    semester: 1,
    semesterLabel: '1st Semester',
    subject: 'Biochemistry',
    department: 'Nucleotide and Nucleic Acid',
    sectionTitle: '1st Semester · Biochemistry · Nucleotide and Nucleic Acid',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1_w_qTuhQoEIchhlZTzBTlaXXDGwzemxJ',
    topics: [
      'Nucleotide Introduction, Function, Components',
      'Nucleosides',
      'Structure and Functions of Important Nucleotides (ATP, c-AMP, NAD, NADP, FAD, CoA)',
      'Nucleic Acids, Structure of DNA & Watson-Crick DNA Model, RNA',
      'Histone Structure and Properties',
      'Chromosomes',
      'Physical & Chemical Properties of DNA',
      'Structure and Functions of Important Nucleotides',
      'Nucleases'
    ]
  },
  {
    id: 's1-bch-enzymes',
    semester: 1,
    semesterLabel: '1st Semester',
    subject: 'Biochemistry',
    department: 'Enzymes',
    sectionTitle: '1st Semester · Biochemistry · Enzymes',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1a11XQp4ndXa3XB9n5ORanihUhqpjgB1B',
    topics: [
      'Introduction, Nature & Properties',
      'Enzyme Nomenclature & Classification (1-6)',
      'Enzyme Inhibition and Inhibitors',
      'Enzymes in Clinical Medicine; Plasma Specific & Non Specific',
      'Regulatory Enzymes',
      'Regulation of Enzyme Activity',
      'Enzyme Kinetics'
    ]
  },
  {
    id: 's1-bch-bioenergetics',
    semester: 1,
    semesterLabel: '1st Semester',
    subject: 'Biochemistry',
    department: 'Bioenergetics & Biological Oxidation',
    sectionTitle: '1st Semester · Biochemistry · Bioenergetics & Biological Oxidation',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1a11XQp4ndXa3XB9n5ORanihUhqpjgB1B',
    topics: [
      'Introduction',
      'Thermodynamic Laws',
      'Free Gibbs Energy, Entropy, Enthalpy, Endergonic & Exergonic Reaction',
      'Common Intermediates and Coupling in Bioenergetics',
      'Hydrolysis and Role of ATP in Metabolism as Energy Currency of Cell',
      'Biological Oxidation',
      'Redox Reactions in Chemistry and Biological Systems',
      'Enzymes Involved in Redox Reactions',
      'Coenzymes and Their Roles'
    ]
  },

  // =========================================================================
  // 2ND SEMESTER
  // =========================================================================
  {
    id: 's2-ana-emb',
    semester: 2,
    semesterLabel: '2nd Semester',
    subject: 'Anatomy',
    department: 'Embryology',
    sectionTitle: '2nd Semester · Embryology',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1RCUbSjRPbu9b_g_PTcHzb0OpvmXvcid5',
    topics: [
      'Development of Arteries',
      'Development of Veins',
      'Fetal and Neonatal Circulation',
      'Development of the Gut I',
      'Development of the Gut II',
      'Development of the Diaphragm / Body Cavities',
      'Development of the Genital System I',
      'Development of Genital (Ducts) II',
      'Development of Genital (External) III'
    ]
  },
  {
    id: 's2-ana-gross-abdomen',
    semester: 2,
    semesterLabel: '2nd Semester',
    subject: 'Anatomy',
    department: 'Gross Anatomy',
    sectionTitle: '2nd Semester · Gross Anatomy · Abdomen',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1dReWmntvpy9jHKgNz3JmA47xgtOKPyCP',
    topics: [
      'Introduction and Bones of the Abdomen',
      'Anterior Abdominal Wall / Rectus Sheath',
      'Inguinal Region / Canal & Inguinal Hernia',
      'Peritoneum-Peritoneal Cavity and Omental Bursa',
      'Diaphragm',
      'Spleen, Coeliac Artery and its Branches',
      'Stomach',
      'Small Intestine / Mesentery Proper / Superior Mesenteric Artery',
      'Duodenum and Pancreas',
      'Portal Vein / Portal Venous System / Porto-Caval Anastomoses',
      'Liver / Gall Bladder',
      'Large Intestine / Inferior Mesenteric Artery',
      'Kidneys / Suprarenal Glands',
      'Posterior Abdominal Wall / Vessels, Nerves & Muscles of Lesser Pelvis'
    ]
  },
  {
    id: 's2-ana-gross-pelvis',
    semester: 2,
    semesterLabel: '2nd Semester',
    subject: 'Anatomy',
    department: 'Gross Anatomy',
    sectionTitle: '2nd Semester · Gross Anatomy · Pelvis and Perineum',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1CD3oAwZFUMuiVjB5iwjs839einnUpsLP',
    topics: [
      'Pelvis (Bones)',
      'Pelvic Walls and Associated Structures',
      'Perineum (Anal Triangle / Urogenital Triangle)',
      'Rectum & Anal Canal',
      'Urinary Bladder',
      'Prostate Gland (Male Internal Genital Organs)',
      'Male and Female Urethra',
      'Male External Genital Organs',
      'Ovaries',
      'Uterus',
      'Vagina',
      'Female External Genital Organs'
    ]
  },
  {
    id: 's2-ana-gross-lower',
    semester: 2,
    semesterLabel: '2nd Semester',
    subject: 'Anatomy',
    department: 'Gross Anatomy',
    sectionTitle: '2nd Semester · Gross Anatomy · Lower Limb',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1JoMp4u9HPe-FGXjA0omfsDHBuSrO3lLp',
    topics: [
      'Intro and Bones of Lower Limb',
      'Front of Thigh / Femoral Triangle',
      'Medial Side of Thigh / Adductor Canal',
      'Lumbar Plexus: Femoral and Obturator Nerves',
      'Gluteal Region',
      'Sacral Plexus: Tibial and Common Peroneal Nerves',
      'Femoral Artery and Anastomoses in Gluteal, Thigh & Knee Regions',
      'Hip Joint',
      'Back of Thigh and Popliteal Fossa',
      'Front and Lateral Sides of Leg / Dorsum of Foot',
      'Back of Leg',
      'Knee Joint',
      'Sole of Foot',
      'Ankle, Subtalar and Midtarsal Joints',
      'Arches of The Foot',
      'Lymphatic and Venous Drainage of Lower Limb',
      'Cutaneous / Segmental Innervation of Lower Limb'
    ]
  },
  {
    id: 's2-ana-histo',
    semester: 2,
    semesterLabel: '2nd Semester',
    subject: 'Anatomy',
    department: 'Histology',
    sectionTitle: '2nd Semester · Histology',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1RSEo3VtUhcdako15JmctOsTfRvJ3J2Iy',
    topics: [
      'Stomach',
      'Small Intestine',
      'Large Intestine, Appendix and Rectum',
      'Liver',
      'Gall Bladder, Pancreas',
      'Kidney',
      'Ureter, Urinary Bladder',
      'Pituitary Gland, Islets of Langerhans'
    ]
  },
  {
    id: 's2-phys-resp',
    semester: 2,
    semesterLabel: '2nd Semester',
    subject: 'Physiology',
    department: 'Respiratory Physiology',
    sectionTitle: '2nd Semester · Respiratory Physiology',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1mZvrfzijmdyFn3y76R4Hyu6t26kwWI5P',
    topics: [
      'The Respiratory System',
      'Lung Volumes and Capacities',
      'Inspired Air, Alveolar Air and Expired Air',
      'Transport of Oxygen',
      'Transport of CO2',
      'Hypoxia and Other Problems',
      'Regulation of Respiration'
    ]
  },
  {
    id: 's2-phys-cvs',
    semester: 2,
    semesterLabel: '2nd Semester',
    subject: 'Physiology',
    department: 'Cardiovascular Physiology',
    sectionTitle: '2nd Semester · Cardiovascular Physiology',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1XMxJ9unPhTjxMH17Vgg9EqhZFB5trmLh',
    topics: [
      'Intro to CVS Physio',
      'Electrical Activity of the Heart',
      'Cardiac Cycle (Mechanical Activity)',
      'Regulation of Heart Rate and Cardiac Output',
      'Electrocardiograph (ECG)',
      'Heart Sounds',
      'Structure and Function of Blood Vessels',
      'Blood Pressure',
      'Cardiovascular Disorders',
      'Blood Flow in Special Areas'
    ]
  },
  {
    id: 's2-phys-renal',
    semester: 2,
    semesterLabel: '2nd Semester',
    subject: 'Physiology',
    department: 'Renal Physiology',
    sectionTitle: '2nd Semester · Renal Physiology',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1wqMBWl2ZLN86LINTsATys1SKYO_BTqVD',
    topics: [
      'Body Fluid Compartments',
      'Edema',
      'Kidney',
      'Nephron',
      'Measurement of Renal Blood Flow and GFR',
      'Urine Production',
      'Mechanism for Concentration and Diluting Urine',
      'Acid-Base Balance',
      'The Tubular Buffers (Acidification of Urine)',
      'Micturition / Micturition Reflex'
    ]
  },
  {
    id: 's2-phys-git',
    semester: 2,
    semesterLabel: '2nd Semester',
    subject: 'Physiology',
    department: 'Gastrointestinal Physiology',
    sectionTitle: '2nd Semester · Gastrointestinal Physiology',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1WRmub5mi6DqL8ofgCUmjgtDbYQX8ZBLi',
    topics: [
      'Introduction to GIT Physio',
      'GIT Motility',
      'GI Hormones',
      'Salivary Secretions',
      'Gastric Secretions',
      'Pancreatic Secretions',
      'Digestion and Absorption'
    ]
  },
  {
    id: 's2-bch-digestion',
    semester: 2,
    semesterLabel: '2nd Semester',
    subject: 'Biochemistry',
    department: 'Digestion and Absorption',
    sectionTitle: '2nd Semester · Biochemistry · Digestion and Absorption',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1_w_qTuhQoEIchhlZTzBTlaXXDGwzemxJ',
    topics: [
      'Intro to Digestion and Absorption',
      'Carbohydrate Digestion and Absorption',
      'GLUT Transporters',
      'Lipid Digestion and Absorption',
      'Protein Digestion and Absorption',
      'Nucleic Acid Digestion and Absorption',
      'Abnormalities and Disorders Associated with Digestion'
    ]
  },
  {
    id: 's2-bch-carb-metab',
    semester: 2,
    semesterLabel: '2nd Semester',
    subject: 'Biochemistry',
    department: 'Carbohydrate Metabolism',
    sectionTitle: '2nd Semester · Biochemistry · Carbohydrate Metabolism',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1W8Zf7iPqCsj0Oq49F7zvLy0gP9TnIeYe',
    topics: [
      'Introduction to Metabolism',
      'Biochemical Roles of Carb Metab',
      'Glycolysis',
      'TCA Cycle',
      'ETC and Oxidative Phosphorylation',
      'Pentose Phosphate Pathway',
      'Gluconeogenesis',
      'Diabetes',
      'Metabolism of Fructose & Galactose',
      'Glycogen'
    ]
  },
  {
    id: 's2-bch-lipid-metab',
    semester: 2,
    semesterLabel: '2nd Semester',
    subject: 'Biochemistry',
    department: 'Lipid Metabolism',
    sectionTitle: '2nd Semester · Biochemistry · Lipid Metabolism',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1W6NOWRuO3RdM7narbunJQNb_PcSTRnc1',
    topics: [
      'Lipid Transport: Albumins and Lipoproteins',
      'Reverse Cholesterol Transport',
      'Abnormalities of Lipoprotein Metab (Dyslipidemias)',
      'TAG Metabolism',
      'Fatty Acid Beta-Oxidation and Clinical Correlates',
      'Energetics and Regulation of Beta-Oxidation',
      'Alpha and Omega Oxidation & Clinical Correlate (Refsum\'s)',
      'Fatty Acid Synthesis and Regulation',
      'Ketone Body Metabolism, Ketogenesis',
      'Ketogenolysis',
      'Essential Fatty Acids and Biomedical Roles',
      'Cholesterol Structure, Functions, Biosynthesis / Synthesis of Cholesterol Esters',
      'Regulation of Cholesterol Synthesis',
      'Bile Acid Synthesis & Bile Salts',
      'LDL Cholesterol and Atherosclerosis',
      'Disorders of Lipid Metabolism (Sphingolipidoses, Nieman Pick, Gauchers, Tay-Sachs)',
      'Abnormalities of Lipoprotein Metab (Dyslipidemias, Hyperlipidemia etc)',
      'Fatty Liver',
      'Phospholipids, Glycolipids and Eicosanoids Metabolism'
    ]
  },
  {
    id: 's2-bch-aa-metab',
    semester: 2,
    semesterLabel: '2nd Semester',
    subject: 'Biochemistry',
    department: 'Amino Acid / Protein Metabolism',
    sectionTitle: '2nd Semester · Biochemistry · Amino Acid / Protein Metabolism',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1g5R5_DHQrGDqel9oseslWvql8M2EC236',
    topics: [
      'Introduction, Amino Acid Pool, Nitrogen Balance',
      'Essential and Non-Essential Amino Acids',
      'Catabolism of Amino Acids (Transamination and Oxidative Deamination)',
      'Role of Glutamate in Metabolism of Amino Acid Nitrogen',
      'Urea Cycle and Regulation',
      'Metabolism of Ammonia',
      'Glucose-Alanine Cycle',
      'Hyperammonemia',
      'Synthesis of Non-Essential Amino Acids',
      'Metabolism of Branched Chain Amino Acids',
      'In-Born Errors of Amino Acid Metabolism'
    ]
  },
  {
    id: 's2-bch-nuc-metab',
    semester: 2,
    semesterLabel: '2nd Semester',
    subject: 'Biochemistry',
    department: 'Nucleotide / Nucleic Acid Metabolism',
    sectionTitle: '2nd Semester · Biochemistry · Nucleotide / Nucleic Acid Metabolism',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1g5R5_DHQrGDqel9oseslWvql8M2EC236',
    topics: [
      'Purine Synthesis, Catabolism, Salvage Pathway, Regulations & Clinical Correlates',
      'Pyrimidine Synthesis, Catabolism, Salvage Pathway, Regulations & Clinical Correlates',
      'Clinical Relevance of THF',
      'Replication',
      'Transcription',
      'Translation'
    ]
  },
  {
    id: 's2-bch-mol-bio',
    semester: 2,
    semesterLabel: '2nd Semester',
    subject: 'Biochemistry',
    department: 'Molecular Biology',
    sectionTitle: '2nd Semester · Biochemistry · Molecular Biology',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1_w_qTuhQoEIchhlZTzBTlaXXDGwzemxJ',
    topics: [
      'Introduction',
      'DNA Sequencing Methods',
      'Polymerase Chain Reactions and its Uses',
      'Restriction Enzymes',
      'Biotechnology and Medicine',
      'Genomic Libraries',
      'Recombinant DNA Technology',
      'Concepts of Probes, Blotting',
      'Vectors',
      'Gene Therapy',
      'Screening for Genetic Diseases',
      'Monoclonal Antibodies'
    ]
  },

  // =========================================================================
  // 3RD SEMESTER
  // =========================================================================
  {
    id: 's3-ana-emb',
    semester: 3,
    semesterLabel: '3rd Semester',
    subject: 'Anatomy',
    department: 'Embryology',
    sectionTitle: '3rd Semester · Embryology',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1FCvbEY_GVNdWQDvEBPo35eTUcT8flETl',
    topics: [
      'Pharyngeal Arches',
      'Pharyngeal Pouches and Clefts',
      'Development of Face, Nose and Palate',
      'Development of Spinal Cord',
      'Development of Medulla Oblongata, Cerebellum and Pons',
      'Development of Mesencephalon',
      'Development of Prosencephalon',
      'Development of Eye',
      'Development of Ear'
    ]
  },
  {
    id: 's3-ana-gross-headneck',
    semester: 3,
    semesterLabel: '3rd Semester',
    subject: 'Anatomy',
    department: 'Gross Anatomy',
    sectionTitle: '3rd Semester · Gross Anatomy · Head and Neck',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1ZRJe_V7Woflp3o0W00kqHVwiiOHH32-L',
    topics: [
      '*1. Living Anatomy of the Head and Neck',
      '*2. Osteology of Head and Neck',
      'The Scalp and the Face',
      'Triangles of the Neck',
      'Course and Distributions of External and Internal Carotid Arteries',
      'The Thyroid and Parathyroid Glands',
      'Parotid Gland',
      'Temporomandibular Joint: Muscles of Mastication',
      'Submandibular Region & Pterygopalatine Fossa',
      'Pharynx',
      'Nasal Cavity & Paranasal Air Sinuses',
      'Larynx',
      'Tongue',
      'The Ear',
      'The Eye'
    ]
  },
  {
    id: 's3-ana-neuro',
    semester: 3,
    semesterLabel: '3rd Semester',
    subject: 'Anatomy',
    department: 'Neuroanatomy',
    sectionTitle: '3rd Semester · Neuroanatomy',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1cDu36d_DslAwTESMrDfekhK5UbX1mq6j',
    topics: [
      'Cranial Nerves V & VII',
      'Cranial Nerves IX, X and XI',
      'Contents of the Vertebral Canal',
      'Receptors, Effectors and Synapses',
      'External Features and Internal Structure of the Spinal Cord',
      'External Features and Internal Structure of the Brain Stem',
      'External Features and Internal Structure of the Cerebellum',
      'External Features of Cerebrum and Cerebral Cortex',
      'White Matter of Cerebrum / Basal Ganglia',
      'Diencephalon',
      'Tracts of Spinal Cord and Brain Stem',
      'Auditory and Vestibular Pathways / Olfactory Pathway',
      'Visual Pathway',
      'Ventricles of the Brain / CSF',
      'Blood Supply of the CNS'
    ]
  },
  {
    id: 's3-ana-histo',
    semester: 3,
    semesterLabel: '3rd Semester',
    subject: 'Anatomy',
    department: 'Histology',
    sectionTitle: '3rd Semester · Histology',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/18gE1Jr0dKbvSn5s3Qe9Nukl-bCu-VBnq',
    topics: [
      '*1. Thyroid and Suprarenal Glands',
      '*2. Testis, Epididymis',
      '*3. Vas Deferens, Seminal Vesicle, Prostate',
      'Penis and Urethra',
      'Ovary',
      'Uterine Tube, Uterus, Vagina',
      'Mammary Gland',
      'Spinal Cord',
      'Cerebellum',
      'Cerebrum',
      'Eye'
    ]
  },
  {
    id: 's3-phys-endo',
    semester: 3,
    semesterLabel: '3rd Semester',
    subject: 'Physiology',
    department: 'Endocrine Physiology',
    sectionTitle: '3rd Semester · Endocrine Physiology',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1UPGLhBe4nW8_B5L3kWIgu2x80LYPOkNR',
    topics: [
      'General Principles of Endocrinology',
      'Hypothalamus & Pituitary Glands',
      'Thyroid Gland',
      'Calcium Homeostasis - Bone and Calcium Metabolism',
      'Parathyroid Gland',
      'Endocrine Functions of the Pancreas',
      'Adrenal Gland: Medulla',
      'Adrenal Gland: Cortex',
      'Endocrine Functions of Other Glands/Organs'
    ]
  },
  {
    id: 's3-phys-repro',
    semester: 3,
    semesterLabel: '3rd Semester',
    subject: 'Physiology',
    department: 'Reproductive Physiology',
    sectionTitle: '3rd Semester · Reproductive Physiology',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1LwmWjFHT7dFf5RWnakEnddLEckXd8VvA',
    topics: [
      'Introduction, Chromosomal Differentiation, Embryology',
      'Puberty, Climacteric and Menopause',
      'Physio Of Human Sexual Response',
      'The Male Reproductive System & Male Sexual Response',
      'The Female Reproductive System & Female Sexual Response',
      'Pregnancy & Lactation',
      'Fertility Regulation & Contraception'
    ]
  },
  {
    id: 's3-phys-neuro-motor',
    semester: 3,
    semesterLabel: '3rd Semester',
    subject: 'Physiology',
    department: 'Neurophysiology',
    subdivision: 'Motor',
    sectionTitle: '3rd Semester · Neurophysiology · Motor',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1E3kGRBDa8pai66Bo6wZ6iJAWoBVWmJGK',
    topics: [
      'Introduction to Motor System',
      'Reflexes',
      'Ventral Horn Cells',
      'EEG and Human Sleep',
      'Cerebellum',
      'Basal Ganglia',
      'Hypothalamus',
      'Limbic System',
      'Pyramidal and Extra Pyramidal Tracts'
    ]
  },
  {
    id: 's3-phys-neuro-sensory',
    semester: 3,
    semesterLabel: '3rd Semester',
    subject: 'Physiology',
    department: 'Neurophysiology',
    subdivision: 'Sensory',
    sectionTitle: '3rd Semester · Neurophysiology · Sensory',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1E3kGRBDa8pai66Bo6wZ6iJAWoBVWmJGK',
    topics: [
      'Introduction to Sensory System',
      'Sensory Receptors',
      'Sensory Coding',
      'Sensory Pathways',
      'Transmission of Special Sensations',
      'Pain Pathway (Ascending and Descending)',
      'Thalamus'
    ]
  },
  {
    id: 's3-phys-neuro-special',
    semester: 3,
    semesterLabel: '3rd Semester',
    subject: 'Physiology',
    department: 'Neurophysiology',
    subdivision: 'Special Senses',
    sectionTitle: '3rd Semester · Neurophysiology · Special Senses',
    courseCode: '',
    driveUrl: 'https://drive.google.com/drive/folders/1E3kGRBDa8pai66Bo6wZ6iJAWoBVWmJGK',
    topics: [
      'Physiology of Vision',
      'Physiology of Audition',
      'The Chemical Senses'
    ]
  },
  {
    id: 's3-bch-341-nutrition',
    semester: 3,
    semesterLabel: '3rd Semester',
    subject: 'Biochemistry',
    department: 'Principles of Nutrition',
    sectionTitle: '3rd Semester · 341 · Principles of Nutrition',
    courseCode: '341',
    driveUrl: 'https://drive.google.com/drive/folders/1H8_IlmZhUPp81IUpY4eTXKcEpP8PhEaa',
    topics: [
      'Nutrition',
      'Essential & Non-Essential Nutrients',
      'Components of Macro and Micro Nutrients',
      'Nutritional Importance of Carbs, Proteins and Fats',
      'Nutritional Diseases/Disorders Caused by Macro-Nutrients',
      'Nutritional Diseases Caused by Micro-Nutrients Deficiencies',
      'General Consideration of Vegetarian Diet'
    ]
  },
  {
    id: 's3-bch-341-vitamins',
    semester: 3,
    semesterLabel: '3rd Semester',
    subject: 'Biochemistry',
    department: 'Vitamins',
    sectionTitle: '3rd Semester · 341 · Vitamins',
    courseCode: '341',
    driveUrl: 'https://drive.google.com/drive/folders/1H8_IlmZhUPp81IUpY4eTXKcEpP8PhEaa',
    topics: [
      'Introduction',
      'Classifications of Vitamins',
      'Vitamin B',
      'Vitamin C',
      'Vitamin A',
      'Vitamin D',
      'Vitamin E',
      'Vitamin K',
      'Antioxidant Vitamins'
    ]
  },
  {
    id: 's3-bch-341-minerals',
    semester: 3,
    semesterLabel: '3rd Semester',
    subject: 'Biochemistry',
    department: 'Minerals',
    sectionTitle: '3rd Semester · 341 · Minerals',
    courseCode: '341',
    driveUrl: 'https://drive.google.com/drive/folders/1H8_IlmZhUPp81IUpY4eTXKcEpP8PhEaa',
    topics: [
      'Classification',
      'Sources',
      'Biochemical Roles',
      'Deficiency',
      'Toxicity',
      'Antioxidant Minerals'
    ]
  },
  {
    id: 's3-bch-351-group1-hormones',
    semester: 3,
    semesterLabel: '3rd Semester',
    subject: 'Biochemistry',
    department: 'Group I Hormones',
    sectionTitle: '3rd Semester · 351 · Group I Hormones',
    courseCode: '351',
    driveUrl: 'https://drive.google.com/drive/folders/11eXE16L96MIzbap-EeDyCKPNRof2_SNU',
    topics: [
      'Intro, Definition and Classification of Hormones',
      'Steroid Hormones'
    ]
  },
  {
    id: 's3-bch-351-group2-hormones',
    semester: 3,
    semesterLabel: '3rd Semester',
    subject: 'Biochemistry',
    department: 'Group II Hormones',
    sectionTitle: '3rd Semester · 351 · Group II Hormones',
    courseCode: '351',
    driveUrl: 'https://drive.google.com/drive/folders/11eXE16L96MIzbap-EeDyCKPNRof2_SNU',
    topics: [
      'Hormones of the Hypophysis (Anterior and Posterior Pituitary Gland)',
      'Thyroid and Parathyroid Hormones',
      'Hormones of the Adrenal Medulla',
      'Hormones of The Pancreas',
      'Hormones of the GIT'
    ]
  },
  {
    id: 's3-bch-351-heme',
    semester: 3,
    semesterLabel: '3rd Semester',
    subject: 'Biochemistry',
    department: 'Heme Proteins',
    sectionTitle: '3rd Semester · 351 · Heme Proteins',
    courseCode: '351',
    driveUrl: 'https://drive.google.com/drive/folders/11eXE16L96MIzbap-EeDyCKPNRof2_SNU',
    topics: [
      'Structure and Function',
      'Biosynthesis and Degradation of Heme',
      'Regulation of Heme Synthesis',
      'Disorders of Heme Synthesis',
      'Hemoglobin Synthesis',
      'Globin Chains and Disorders'
    ]
  },
  {
    id: 's3-bch-351-xenobiotics',
    semester: 3,
    semesterLabel: '3rd Semester',
    subject: 'Biochemistry',
    department: 'Xenobiotics',
    sectionTitle: '3rd Semester · 351 · Xenobiotics',
    courseCode: '351',
    driveUrl: 'https://drive.google.com/drive/folders/11eXE16L96MIzbap-EeDyCKPNRof2_SNU',
    topics: [
      'Introduction and General Concepts',
      'Phase 1 Rxns of Xenobiotics',
      'Phase 2 Rxns of Xenobiotics',
      'Organs Involved in Xenobiotics Metabolism',
      'Organs Involved in Xenobiotics',
      'Enzymes Involved in Xenobiotics',
      'Mechanism and Fate of Xenobiotic Metab'
    ]
  },
  {
    id: 's3-bch-351-neurochem',
    semester: 3,
    semesterLabel: '3rd Semester',
    subject: 'Biochemistry',
    department: 'Neurochemistry',
    sectionTitle: '3rd Semester · 351 · Neurochemistry',
    courseCode: '351',
    driveUrl: 'https://drive.google.com/drive/folders/11eXE16L96MIzbap-EeDyCKPNRof2_SNU',
    topics: [
      'Nervous Communication, Neurons & Nerve, Supporting Cells',
      'Definitions and Classification of Neurotransmitters',
      'GABA and GABA Shunt',
      'Metabolic Profile of The Brain'
    ]
  },
  {
    id: 's3-bch-351-muscle-metab',
    semester: 3,
    semesterLabel: '3rd Semester',
    subject: 'Biochemistry',
    department: 'Muscle Metabolism',
    sectionTitle: '3rd Semester · 351 · Muscle Metabolism',
    courseCode: '351',
    driveUrl: 'https://drive.google.com/drive/folders/11eXE16L96MIzbap-EeDyCKPNRof2_SNU',
    topics: [
      'Brief Review of The Anatomy and Physiology of Muscle Cell',
      'Structure and Functions of the Important Muscle Protein',
      'Mechanism of Muscle Contraction and its Bioenergetics',
      'Other Contractile Structures and Proteins'
    ]
  },
  {
    id: 's3-bch-351-immunochem',
    semester: 3,
    semesterLabel: '3rd Semester',
    subject: 'Biochemistry',
    department: 'Immunochemistry',
    sectionTitle: '3rd Semester · 351 · Immunochemistry',
    courseCode: '351',
    driveUrl: 'https://drive.google.com/drive/folders/11eXE16L96MIzbap-EeDyCKPNRof2_SNU',
    topics: [
      'The Immune Response',
      'Humoral Immunity (Production of Antibodies)',
      'Cell Mediated Immunity',
      'Immunological Tolerance'
    ]
  }
];

export const CURRICULUM_SECTIONS = Object.freeze(
  RAW_SECTIONS.map((sec, sIdx) => ({
    ...sec,
    order: sIdx + 1,
    subdivision: sec.subdivision || ''
  }))
);

export const OFFICIAL_TOPICS = Object.freeze(
  CURRICULUM_SECTIONS.flatMap((sec) =>
    sec.topics.map((title, tIdx) => ({
      id: `${sec.id}-t${tIdx + 1}`,
      code: `${sec.semester}.${sec.order}.${tIdx + 1}`,
      title,
      subject: sec.subject,
      semester: sec.semester,
      semesterLabel: sec.semesterLabel,
      department: sec.department,
      subdivision: sec.subdivision,
      courseCode: sec.courseCode,
      sectionId: sec.id,
      sectionTitle: sec.sectionTitle,
      driveUrl: sec.driveUrl,
      isOfficial: true
    }))
  )
);
