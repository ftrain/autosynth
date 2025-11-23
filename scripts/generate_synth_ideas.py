#!/usr/bin/env python3
"""Generate 1000 synth ideas across 10 domains."""
import csv
import random

domains = {
    "computer_history": {
        "range": (1, 100),
        "prefixes": ["Modem", "Floppy", "CRT", "Dial-Up", "Dot Matrix", "Punch Card", "ENIAC", "BBS", "Hard Drive", "Serial", "Parallel", "Vacuum Tube", "Transistor", "Calculator", "Atari", "Teletext", "Fax", "Boot", "Command Line", "Tape", "Memory", "Network", "CPU", "Sinclair", "TRS-80", "Commodore", "BBC Micro", "Apple II", "Plotter", "OCR", "Paper Tape", "Telex", "Morse", "Telegraph", "Rectifier", "Triode", "Cathode", "Phosphor", "Scan Line", "NTSC", "Magnetic", "Ferrite", "Spark Gap", "Crystal Radio", "Phonograph", "Shellac", "Wax Cylinder", "Bakelite", "PCB Trace", "Solder", "Potentiometer", "Stepper", "Servo", "PWM", "Capacitor", "Transistor", "Diode", "MOSFET", "Zener", "Thermistor", "Photoresistor", "Solar Cell", "LED", "Optocoupler", "LDR", "Tape Saturation", "Demagnetization", "Hysteresis", "Eddy Current", "Transformer", "Y2K", "Blue Screen", "Defrag", "Dial Tone", "Touch Tone", "Busy Signal", "Ring Cycle", "Off Hook", "Area Code", "Long Distance", "Rotary", "Phone Booth", "Answering Machine", "Cordless", "Acoustic Coupler", "Party Line", "Operator", "Time Announce", "Weather Service", "Emergency", "Payphone", "Phone Card", "Voicemail", "Conference"],
        "synthesis_types": ["fm", "subtractive", "wavetable", "granular", "physical_modeling", "additive", "sample_based", "feedback", "noise", "hybrid"],
        "genres": ["Retro", "Glitch", "Experimental", "Lo-Fi", "Industrial", "Ambient", "Chiptune", "Digital"]
    },
    "vintage_synths": {
        "range": (101, 200),
        "prefixes": ["Moog", "Buchla", "ARP", "Oberheim", "Prophet", "Juno", "Jupiter", "TB-303", "TR-808", "TR-909", "Fairlight", "Synclavier", "PPG", "DX", "MS-20", "Odyssey", "Serge", "EMS", "Korg", "Roland", "Sequential", "Ensoniq", "Kurzweil", "Waldorf", "Access", "Clavia", "Novation", "Arturia", "DSI", "Elektron", "Teenage", "Modal", "Mutable", "Make Noise", "Intellijel", "Doepfer", "Modcan", "Analogue", "Cwejman", "Metasonix", "Macbeth", "Studio Electronics", "Vermona", "MFB", "Dreadbox", "Erica", "Pittsburgh", "4ms", "Tiptop", "WMD", "Qu-Bit", "Noise Engineering", "Joranalogue", "Instruo", "Frap", "Verbos", "Endorphin", "Steady State", "Rossum", "Livestock", "ALM", "After Later", "Blue Lantern", "Circuit Abbey", "Dove", "EMW", "Future Sound", "Gezeiten", "Happy Nerding", "Industrial Music", "Joranalogue", "Kammerl", "LPZW", "Manhattan", "New Systems", "Olegtron", "Paratek", "Qubit", "RYO", "SSF", "Tesseract", "Ultrasound", "Void", "WMD", "Xaoc", "York", "Zlob", "Atomosynth", "Behringer", "Cre8audio", "Error", "Folktek", "G-Storm"],
        "synthesis_types": ["hybrid", "subtractive", "fm", "wavetable", "additive", "feedback", "noise", "granular", "sample_based", "physical_modeling"],
        "genres": ["Synthwave", "Experimental", "Drone", "Ambient", "Techno", "Industrial", "Acid", "Progressive"]
    },
    "natural_phenomena": {
        "range": (201, 300),
        "prefixes": ["Thunder", "Aurora", "Rain", "Wind", "Hurricane", "Blizzard", "Earthquake", "Volcanic", "Geothermal", "Crystal", "Cave", "Mineral", "Tectonic", "Lava", "Stalactite", "Ocean", "Tsunami", "Deep Sea", "Waterfall", "Glacier", "River", "Frozen Lake", "Whirlpool", "Ice", "Heartbeat", "Breath", "Neural", "Neuron", "Cell", "DNA", "Bacterial", "Amino", "Mitochondria", "Protein", "Organ", "Bone", "Forest", "Desert", "Swamp", "Rainforest", "Grassland", "Reef", "Fungal", "Coral", "Ant Colony", "Wolf Pack", "Pulsar", "Solar Wind", "Black Hole", "Supernova", "Quasar", "Neutron", "Cosmic", "Magnetar", "Zodiacal", "Chemical", "Catalyst", "Exothermic", "Crystal", "Oxidation", "Fermentation", "Polymer", "Photosynthesis", "Combustion", "Radioactive", "Entropy", "Wave", "Harmonic", "Frequency", "Phase", "Doppler", "Acoustic", "Overtone", "Spring", "Summer", "Autumn", "Winter", "Thaw", "Monsoon", "Dry Season", "Permafrost", "Tidal", "Spring Tide", "Neap Tide", "Rip Current", "Undertow", "Ebb Flow", "Coastline", "River Meander", "Sediment", "Canyon", "Dune", "Landslide", "Weathering", "Fractal", "Spiral", "Fibonacci", "Sunflower"],
        "synthesis_types": ["fm", "subtractive", "wavetable", "granular", "physical_modeling", "additive", "feedback", "noise", "hybrid", "sample_based"],
        "genres": ["Ambient", "Dark Ambient", "Experimental", "Drone", "Cinematic", "Meditative", "Natural", "Ethereal"]
    },
    "industrial": {
        "range": (301, 400),
        "prefixes": ["Gear", "Piston", "Turbine", "Conveyor", "Welding", "Pneumatic", "Steam", "Furnace", "Jackhammer", "Transformer", "Relay", "Valve", "Grinding", "Chain", "Hydraulic", "Drill", "Stamping", "Factory", "Demolition", "Engine", "Motor", "Compressor", "Electromagnetic", "Siren", "Saw Blade", "Forging", "Magnetic", "Electrical", "Air Brake", "Compression", "Pulse", "Speed Ramp", "Clock", "Rotor", "Spindle", "Lathe", "Press", "Roller", "Conveyor", "Hoist", "Crane", "Winch", "Pulley", "Lever", "Cam", "Crank", "Flywheel", "Governor", "Clutch", "Brake", "Bearing", "Bushing", "Gasket", "Seal", "Pump", "Fan", "Blower", "Compressor", "Turbine", "Generator", "Alternator", "Dynamo", "Motor", "Engine", "Boiler", "Condenser", "Heat Exchanger", "Radiator", "Cooler", "Heater", "Furnace", "Kiln", "Oven", "Dryer", "Mixer", "Agitator", "Centrifuge", "Filter", "Separator", "Crusher", "Grinder", "Mill", "Shredder", "Chipper", "Cutter", "Slicer", "Chopper", "Press", "Extruder", "Molder", "Former", "Welder", "Solder", "Riveter", "Bolter", "Screwer", "Assembler", "Tester", "Inspector"],
        "synthesis_types": ["fm", "subtractive", "wavetable", "granular", "physical_modeling", "additive", "noise", "feedback", "hybrid", "sample_based"],
        "genres": ["Industrial", "Mechanical", "Dark", "Rhythmic", "Percussion", "Texture", "Aggressive", "Ambient"]
    },
    "scientific": {
        "range": (401, 500),
        "prefixes": ["Superposition", "Entanglement", "Heisenberg", "Schrödinger", "Quantum", "Planck", "Wave Function", "Photon", "Antiparticle", "Qubit", "Strange Attractor", "Butterfly", "Logistic", "Lorenz", "Mandelbrot", "Bifurcation", "Chaos", "Sensitive", "Strange Loop", "Attractor", "Fractal", "Julia", "Sierpinski", "Koch", "Apollonian", "Droste", "Barnsley", "Menger", "Möbius", "Klein", "Toroidal", "Genus", "Knot", "Handle", "Topological", "Surface", "Prime", "Sieve", "RSA", "Fermat", "Goldbach", "Mersenne", "Twin Prime", "Riemann", "Modular", "Fibonacci", "Golden Ratio", "Spiral", "Phyllotaxis", "Nautilus", "Entropy", "Thermal", "Second Law", "Heat Death", "Boltzmann", "Temperature", "Phase Transition", "Equilibrium", "Reversibility", "Black Body", "Doppler", "Time Dilation", "Spacetime", "Gravitational", "Light Cone", "Frame Dragging", "Relativistic", "Singularity", "String", "Superstring", "Higgs", "Gauge", "Quark", "Gluon", "Lepton", "Muon", "Neutrino", "Hadron", "Double Slit", "Interference", "Standing Wave", "Node", "Beat Frequency", "Phase Coherence", "Diffraction", "Resonance", "Harmonic", "Overtone", "Formant", "Coupled"],
        "synthesis_types": ["fm", "wavetable", "additive", "granular", "subtractive", "feedback", "hybrid", "noise", "physical_modeling", "sample_based"],
        "genres": ["Experimental", "Ambient", "Abstract", "Mathematical", "Psychoacoustic", "Electronic", "Drone", "Generative"]
    },
    "world_instruments": {
        "range": (501, 600),
        "prefixes": ["Gamelan", "Sitar", "Tabla", "Didgeridoo", "Kalimba", "Mbira", "Koto", "Shamisen", "Erhu", "Pipa", "Oud", "Santoor", "Balalaika", "Bouzouki", "Hurdy Gurdy", "Bagpipe", "Accordion", "Harmonium", "Throat Singing", "Overtone", "Bell", "Gong", "Singing Bowl", "Wind Chimes", "Music Box", "Carillon", "Glass Harmonica", "Waterphone", "Hang Drum", "Jaw Harp", "Bullroarer", "Daegeum", "Hulusi", "Bowed Psaltery", "Steelpan", "Tar", "Qin", "Saz", "Ney", "Nai", "Berimbau", "Riq", "Doumbek", "Ud", "Kemençe", "Suling", "Bamboo", "Rebab", "Cimbalom", "Zither", "Dulcimer", "Autoharp", "Lyre", "Harp", "Kantele", "Bandura", "Gusli", "Kokle", "Jouhikko", "Talharpa", "Langspil", "Hardingfele", "Nyckelharpa", "Säckpipa", "Seljefløyte", "Bukkehorn", "Lur", "Birch Trumpet", "Willow Flute", "Jew's Harp", "Langspil", "Fidla", "Þjóðhátíð", "Bumbulum", "Cuíca", "Pandeiro", "Surdo", "Repique", "Tamborim", "Agogô", "Ganzá", "Reco-Reco", "Chocalho", "Xequerê", "Caxixi", "Afoxé", "Atabaque", "Alfaia", "Zabumba", "Triângulo", "Maracatu", "Berimbau", "Conga", "Bongo", "Timbales", "Güiro", "Maracas", "Claves"],
        "synthesis_types": ["fm", "additive", "physical_modeling", "granular", "wavetable", "sample_based", "hybrid", "subtractive", "feedback", "noise"],
        "genres": ["World", "Ethnic", "Meditative", "Percussive", "Traditional", "Experimental", "Ambient", "Expressive"]
    },
    "space_cosmic": {
        "range": (601, 700),
        "prefixes": ["Pulsar", "Magnetar", "Neutron", "Quasar", "Black Hole", "Event Horizon", "Accretion", "Relativistic", "Hawking", "Supernova", "Stellar", "Cosmic", "Solar Wind", "Nebula", "Dust Cloud", "Emission", "Reflection", "Planetary", "Pillars", "Dark Nebula", "Solar Flare", "Coronal", "Prominence", "Heliosphere", "Photosphere", "Magnetosphere", "Ionosphere", "Radiation Belt", "Solar Cycle", "Aurora", "Green Glow", "Van Allen", "Proton Event", "Ray Shower", "Cherenkov", "Bremsstrahlung", "Cascade", "Muon Decay", "Saturn Rings", "Cassini", "Shepherd", "Ice Particle", "Dust Ring", "Ring Resonance", "Orbital", "Asteroid", "Meteor", "Meteorite", "Ablation", "Atmospheric", "Comet", "Nucleus", "Tail", "Sublimation", "Coma", "Radio Pulsar", "Radio Quiet", "Pulsar Wind", "Fast Radio", "Repeating FRB", "Dispersion", "Pulse Profile", "Radio Morphology", "Synchrotron", "Betatron", "Cyclotron", "Plasma", "Birkeland", "Alfven", "Radio Telescope", "Antenna", "Signal", "Noise Floor", "Interference", "Microwave Background", "Temperature", "Acoustic Peaks", "Gravitational Wave", "Merger", "LIGO", "Ringdown", "Binary", "Dark Matter", "Halo", "WIMP", "Axion", "Spaghettification", "Photon Sphere", "Naked Singularity", "White Hole", "Wormhole", "Kerr", "Reissner", "Tensor", "Metric", "Christoffel", "Ricci", "Einstein"],
        "synthesis_types": ["fm", "wavetable", "additive", "granular", "subtractive", "noise", "feedback", "hybrid", "sample_based", "physical_modeling"],
        "genres": ["Sci-Fi", "Ambient", "Dark", "Cinematic", "Experimental", "Ethereal", "Drone", "Generative"]
    },
    "biological": {
        "range": (701, 800),
        "prefixes": ["Helix", "Ribosome", "Mitochondria", "Synapse", "Heartbeat", "Breathing", "Digestion", "Blood", "Muscle", "Bone", "Skin", "Hair", "Root", "Photon", "Mycelium", "Spore", "Bacterial", "Viral", "Parasite", "Symbiosis", "Metamorphosis", "Cocoon", "Egg", "Birth", "Decay", "Decomposition", "Fossil", "Evolution", "Mutation", "Adaptation", "Axon", "Dendrite", "Ganglion", "Glial", "Vesicle", "Receptor", "Neurotransmitter", "Soma", "Neuropeptide", "Potassium", "Calcium", "GABA", "Glutamate", "Dopamine", "Serotonin", "Cortisol", "Adrenaline", "Melatonin", "Endorphin", "Oxytocin", "Insulin", "Cortex", "Cerebellum", "Hippocampus", "Amygdala", "Thalamus", "Pineal", "Pituitary", "Hypothalamus", "Cerebral", "Nerve", "Glial Scar", "White Matter", "Gray Matter", "Synaptogenesis", "Myelin", "Membrane", "Vesicular", "Retrograde", "Presynaptic", "Postsynaptic", "Heterosynaptic", "Homosynaptic", "Neuromuscular", "Motor Neuron", "Proprioception", "Cutaneous", "Nociception", "Thermoreception", "Chemoreception", "Photoreception", "Equilibrium", "Temporal Bone", "Cochlear", "Hair Cell", "Vestibular", "Organ of Corti", "Endolymph", "Perilymph", "Stapes", "Ossicle", "Ear Canal", "Tympanum", "Auditory Cortex"],
        "synthesis_types": ["fm", "feedback", "granular", "wavetable", "additive", "subtractive", "hybrid", "noise", "sample_based", "physical_modeling"],
        "genres": ["Experimental", "Ambient", "Organic", "Meditative", "Dark", "Electronic", "Psychoacoustic", "Generative"]
    },
    "experimental": {
        "range": (801, 900),
        "prefixes": ["Escher", "Paradox", "Hypnagogic", "Hallucination", "Synesthetic", "Temporal", "Parallel", "Glitch Reality", "Inverted", "Recursive", "Impossible", "Ego Death", "Consciousness", "Rebirth", "Memory Decay", "Uncanny Valley", "Liminal", "Cosmic Horror", "Abstract", "Color-Sound", "Taste-Timbre", "Thought", "Memetic", "Infinite Regression", "Broken Physics", "Quantum Superposition", "Time Loop", "Alternate Dimension", "Synapse Misfire", "Void", "Möbius", "Dream", "Perception", "Entropy", "Echo Nowhere", "Consciousness Download", "Backwards Evolution", "Probability Cloud", "Inverse Mirror", "Nested Consciousness", "Artifact", "Reality Seam", "Dreamcatcher", "Letter Frequencies", "Ego Fragment", "Entropy Crystal", "Hyperbolic", "Threshold", "Memetic Infection", "Broken Causality", "Alternate Timeline", "Emotion Mapping", "Identity Processor", "Probability", "Void Resonance", "Decay Memory", "Shape Tones", "Inverted Envelope", "Eternal Moment", "Parallel Perception", "Thought-Space", "Glitch Consciousness", "Backwards Speech", "Membrane", "Echo Chamber", "Kaleidoscope", "Void Creature", "Consciousness Cascade", "Scent-Sound", "Entropy Reversal", "Impossible Interval", "Dream Logic", "Membrane Between", "Ego Death Progression", "Recursive Dream", "Motion-Sound", "Quantum Foam", "Alternate Logic", "Conscious Feedback", "Taste-Color-Sound", "Liminal Dream", "Thought Crystal", "Broken Mirror", "Parallel Leak", "Pain-Sound", "Void Echo", "Impossible Object", "Consciousness Threshold", "Recursive Nest", "Dream-Logic", "Electromagnetic", "Entropy-Driven", "Perceptual", "Time-Reversed", "Paradox Resonator", "Gravity-Sound", "Void Between"],
        "synthesis_types": ["fm", "granular", "hybrid", "additive", "noise", "feedback", "wavetable", "subtractive", "physical_modeling", "sample_based"],
        "genres": ["Experimental", "Ambient", "Weird", "Psychoacoustic", "Glitch", "Surreal", "Abstract", "Unsettling"]
    },
    "generative": {
        "range": (901, 1000),
        "prefixes": ["Conway Life", "Wolfram", "L-System", "Genetic Algorithm", "Markov Chain", "Perlin Noise", "Flocking", "Ant Colony", "Lorenz", "Turing Pattern", "Rossler", "Henon", "Chua", "Ikeda", "Tent Map", "Baker Map", "Horseshoe", "Arnold", "Standard Map", "Chirikov", "Logistic", "Mandelbrot", "Julia", "Newton", "Halley", "Householder", "Secant", "Bisection", "False Position", "Fixed Point", "Picard", "Banach", "Contraction", "Lipschitz", "Cauchy", "Euler", "Runge-Kutta", "Adams", "Milne", "Hamming", "Predictor", "Corrector", "Multistep", "Linear Multistep", "Backward Difference", "Gear", "BDF", "Trapezoidal", "Midpoint", "Heun", "RK2", "RK4", "RKF45", "Dormand", "Prince", "Cash-Karp", "Bogacki", "Shampine", "Fehlberg", "Verner", "Butcher", "Singly Diagonal", "Embedded", "Adaptive", "Variable Step", "Dense Output", "Continuous", "Interpolating", "Collocation", "Galerkin", "Petrov", "Spectral", "Finite Element", "Boundary Element", "Finite Volume", "Finite Difference", "Pseudospectral", "Chebyshev", "Legendre", "Hermite", "Laguerre", "Jacobi", "Gegenbauer", "Ultraspherical", "Associated Legendre", "Spherical Harmonic", "Zernike", "Bessel", "Hankel", "Neumann", "Struve", "Airy", "Scorer", "Kelvin", "Lommel", "Anger", "Weber"],
        "synthesis_types": ["hybrid", "wavetable", "additive", "granular", "feedback", "noise", "fm", "subtractive", "sample_based", "physical_modeling"],
        "genres": ["Generative", "Ambient", "Experimental", "Glitch", "Algorithmic", "Chaotic", "Self-Organizing", "Emergent"]
    }
}

# Feature templates
features = [
    "oscillator coupling", "harmonic mapping", "spectral morphing", "granular density", 
    "feedback routing", "modulation matrix", "wavetable scanning", "physical resonance",
    "envelope shaping", "filter topology", "chaos modulation", "fractal generation",
    "pattern sequencing", "stochastic triggering", "recursive feedback", "harmonic series",
    "ring modulation", "frequency shifting", "phase distortion", "wavefolding",
    "sample rate reduction", "bit crushing", "spectral freeze", "time stretching",
    "pitch shifting", "formant filtering", "comb filtering", "allpass diffusion",
    "convolution", "granular freeze", "spectral blur", "harmonic excitation"
]

def generate_description(prefix, domain):
    templates = [
        f"{prefix}-inspired synthesis with unique timbral characteristics",
        f"Models {prefix.lower()} behavior using advanced DSP techniques",
        f"{prefix} patterns drive oscillator and modulation parameters",
        f"Physical modeling of {prefix.lower()} acoustic properties",
        f"Granular processing inspired by {prefix.lower()} textures",
        f"FM synthesis capturing {prefix.lower()} harmonic relationships",
        f"Wavetable morphing based on {prefix.lower()} waveforms",
        f"Additive synthesis recreating {prefix.lower()} spectra",
        f"Feedback network simulating {prefix.lower()} dynamics",
        f"Hybrid synthesis combining multiple {prefix.lower()} characteristics"
    ]
    return random.choice(templates)

with open('/home/user/autosynth/synth_ideas.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['id', 'name', 'description', 'synthesis_type', 'key_feature', 'genre_tags', 'weirdness_level'])
    
    for domain_name, domain in domains.items():
        start, end = domain["range"]
        prefixes = domain["prefixes"]
        synth_types = domain["synthesis_types"]
        genres = domain["genres"]
        
        for i, idx in enumerate(range(start, end + 1)):
            prefix = prefixes[i % len(prefixes)]
            name = f"{prefix} {'Synth' if random.random() > 0.5 else random.choice(['Engine', 'Generator', 'Oscillator', 'Filter', 'Processor', 'Modulator', 'Resonator', 'Sequencer'])}"
            desc = generate_description(prefix, domain_name)
            synth_type = synth_types[i % len(synth_types)]
            feature = random.choice(features)
            genre = ";".join(random.sample(genres, min(3, len(genres))))
            weirdness = random.randint(2, 9) if "experimental" not in domain_name else random.randint(6, 10)
            
            writer.writerow([idx, name, desc, synth_type, feature, genre, weirdness])

print("Generated 1000 synth ideas!")
