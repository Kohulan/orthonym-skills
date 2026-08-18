# RDKit Perception for Chemistry Development

**Purpose:** RDKit functions for molecular perception — functional groups, rings, chains,
stereochemistry — the building blocks any chemistry tool needs, whether it names structures,
predicts properties, proposes reactions, or screens libraries.

**Source:** RDKit documentation

---

## 1. Molecule Input and Sanitization

### Basic Parsing

```python
from rdkit import Chem
from rdkit.Chem import AllChem, rdMolDescriptors
from rdkit.Chem.rdCIPLabeler import AssignCIPLabels

# Parse SMILES
mol = Chem.MolFromSmiles(smiles)
if mol is None:
    raise ValueError(f"Invalid SMILES: {smiles}")

# Canonicalize first (recommended)
canonical_smiles = Chem.CanonSmiles(smiles)
mol = Chem.MolFromSmiles(canonical_smiles)

# Add explicit hydrogens when needed
mol_with_h = Chem.AddHs(mol)
```

### Kekulization

```python
# For aromatic perception
Chem.Kekulize(mol, clearAromaticFlags=False)

# Check aromaticity
for atom in mol.GetAtoms():
    if atom.GetIsAromatic():
        print(f"Atom {atom.GetIdx()} is aromatic")
```

## 2. Functional Group Detection (SMARTS)

### SMARTS Pattern Matching

```python
from rdkit import Chem

# Define SMARTS patterns (ordered by seniority)
FG_PATTERNS = {
    'carboxylic_acid': '[CX3](=O)[OX2H1]',
    'ester': '[CX3](=O)[OX2][#6]',
    'aldehyde': '[CX3H1](=O)[#6,H]',
    'ketone': '[#6][CX3](=O)[#6]',
    'alcohol': '[OX2H1][CX4]',
    'amine_primary': '[NX3H2][CX4]',
    'amine_secondary': '[NX3H1]([CX4])[CX4]',
    'amine_tertiary': '[NX3]([CX4])([CX4])[CX4]',
    'nitrile': '[CX2]#[NX1]',
    'amide': '[CX3](=O)[NX3H2,NX3H1,NX3]',
}

def find_functional_groups(mol):
    """Find all functional groups in molecule."""
    groups = []
    for name, smarts in FG_PATTERNS.items():
        pattern = Chem.MolFromSmarts(smarts)
        matches = mol.GetSubstructMatches(pattern)
        for match in matches:
            groups.append({
                'type': name,
                'atoms': match,
                'priority': get_fg_priority(name)
            })
    return sorted(groups, key=lambda x: x['priority'])
```

### Avoiding Double-Counting

```python
def find_exclusive_groups(mol):
    """Find FGs without overlap (e.g., don't count ester C=O as ketone)."""
    used_atoms = set()
    groups = []

    # Process in seniority order (highest first)
    for name, smarts in sorted(FG_PATTERNS.items(), key=priority):
        pattern = Chem.MolFromSmarts(smarts)
        for match in mol.GetSubstructMatches(pattern):
            if not any(atom in used_atoms for atom in match):
                groups.append({'type': name, 'atoms': match})
                used_atoms.update(match)

    return groups
```

## 3. Ring Detection and Classification

### Basic Ring Info

```python
from rdkit.Chem import rdMolDescriptors

def get_ring_info(mol):
    """Get all ring information."""
    ring_info = mol.GetRingInfo()

    # All rings as atom index tuples
    rings = ring_info.AtomRings()

    # Ring sizes
    for ring in rings:
        size = len(ring)
        print(f"Ring size {size}: atoms {ring}")

    return rings

def is_ring_aromatic(mol, ring_atoms):
    """Check if a ring is aromatic."""
    return all(mol.GetAtomWithIdx(i).GetIsAromatic() for i in ring_atoms)
```

### Fused Ring Detection

```python
def find_fused_rings(mol):
    """Identify fused ring systems."""
    ring_info = mol.GetRingInfo()
    rings = list(ring_info.AtomRings())

    # Build adjacency: rings sharing 2+ atoms are fused
    fused_pairs = []
    for i, ring1 in enumerate(rings):
        for j, ring2 in enumerate(rings[i+1:], i+1):
            shared = set(ring1) & set(ring2)
            if len(shared) >= 2:
                fused_pairs.append((i, j, shared))

    return fused_pairs

def get_ring_system_atoms(mol):
    """Get all atoms in each connected ring system."""
    # Use RDKit's SSSR (smallest set of smallest rings)
    sssr = Chem.GetSymmSSSR(mol)
    # ... group into connected systems
```

### Bicyclo/Spiro Detection

```python
def detect_bicyclo(mol):
    """Detect bicyclo[x.y.z] systems."""
    ring_info = mol.GetRingInfo()
    rings = ring_info.AtomRings()

    if len(rings) < 2:
        return None

    # Find bridgehead atoms (in 2+ rings)
    atom_ring_count = {}
    for ring in rings:
        for atom in ring:
            atom_ring_count[atom] = atom_ring_count.get(atom, 0) + 1

    bridgeheads = [a for a, c in atom_ring_count.items() if c >= 2]

    if len(bridgeheads) == 2:
        # Potential bicyclo system
        return analyze_bicyclo(mol, bridgeheads, rings)

    return None

def detect_spiro(mol):
    """Detect spiro systems (single shared atom)."""
    ring_info = mol.GetRingInfo()
    rings = list(ring_info.AtomRings())

    for i, ring1 in enumerate(rings):
        for ring2 in rings[i+1:]:
            shared = set(ring1) & set(ring2)
            if len(shared) == 1:
                spiro_atom = list(shared)[0]
                return {
                    'spiro_atom': spiro_atom,
                    'ring1': ring1,
                    'ring2': ring2
                }
    return None
```

## 4. Chain Finding (Principal Chain)

### Longest Chain

```python
def find_longest_chain(mol, exclude_atoms=set()):
    """Find the longest carbon chain."""
    from collections import deque

    # Get all carbon atoms not in rings
    carbons = [
        atom.GetIdx() for atom in mol.GetAtoms()
        if atom.GetAtomicNum() == 6
        and not atom.IsInRing()
        and atom.GetIdx() not in exclude_atoms
    ]

    if not carbons:
        return []

    # BFS from each terminal carbon
    longest = []
    for start in carbons:
        chain = bfs_longest_path(mol, start, carbons)
        if len(chain) > len(longest):
            longest = chain

    return longest

def find_principal_chain(mol, functional_groups):
    """
    IUPAC 2013 principal chain selection:
    1. Contains principal characteristic group
    2. Maximum number of principal groups
    3. Maximum chain length
    4. Maximum multiple bonds
    5. Lowest locants for principal groups
    """
    # Implementation follows IUPAC priority order
    pass
```

## 5. Stereochemistry Perception

### CIP Labels (R/S, E/Z)

```python
from rdkit.Chem.rdCIPLabeler import AssignCIPLabels

def get_stereochemistry(mol):
    """Get all stereochemistry labels."""
    # IMPORTANT: Use rdCIPLabeler, not legacy AssignStereochemistry
    AssignCIPLabels(mol)

    stereocenters = []
    for atom in mol.GetAtoms():
        cip = atom.GetPropsAsDict().get('_CIPCode')
        if cip:
            stereocenters.append({
                'atom_idx': atom.GetIdx(),
                'cip': cip,  # 'R' or 'S'
                'type': 'tetrahedral'
            })

    # Double bond stereochemistry
    for bond in mol.GetBonds():
        if bond.GetBondType() == Chem.BondType.DOUBLE:
            stereo = bond.GetStereo()
            if stereo in [Chem.BondStereo.STEREOE, Chem.BondStereo.STEREOZ]:
                cip = 'E' if stereo == Chem.BondStereo.STEREOE else 'Z'
                stereocenters.append({
                    'atoms': (bond.GetBeginAtomIdx(), bond.GetEndAtomIdx()),
                    'cip': cip,
                    'type': 'double_bond'
                })

    return stereocenters
```

### Checking Stereo Validity

```python
def has_defined_stereochemistry(mol):
    """Check if molecule has defined stereochemistry."""
    # Check for undefined stereocenters
    Chem.AssignStereochemistry(mol, cleanIt=True, force=True)

    for atom in mol.GetAtoms():
        if atom.GetChiralTag() != Chem.ChiralType.CHI_UNSPECIFIED:
            cip = atom.GetPropsAsDict().get('_CIPCode')
            if cip is None:
                return False  # Undefined stereocenter

    return True
```

## 6. Atom Properties

### Common Atom Queries

```python
def get_atom_info(atom):
    """Get all relevant info for an atom."""
    return {
        'idx': atom.GetIdx(),
        'symbol': atom.GetSymbol(),
        'atomic_num': atom.GetAtomicNum(),
        'formal_charge': atom.GetFormalCharge(),
        'num_hs': atom.GetTotalNumHs(),
        'hybridization': str(atom.GetHybridization()),
        'is_aromatic': atom.GetIsAromatic(),
        'is_in_ring': atom.IsInRing(),
        'ring_size': get_smallest_ring_size(atom),
        'degree': atom.GetDegree(),
        'neighbors': [n.GetIdx() for n in atom.GetNeighbors()]
    }

def get_smallest_ring_size(atom):
    """Get smallest ring this atom belongs to."""
    if not atom.IsInRing():
        return 0
    mol = atom.GetOwningMol()
    ring_info = mol.GetRingInfo()
    sizes = [len(ring) for ring in ring_info.AtomRings()
             if atom.GetIdx() in ring]
    return min(sizes) if sizes else 0
```

## 7. Bond Analysis

```python
def get_bond_info(mol):
    """Analyze all bonds."""
    bonds = []
    for bond in mol.GetBonds():
        bonds.append({
            'begin': bond.GetBeginAtomIdx(),
            'end': bond.GetEndAtomIdx(),
            'type': str(bond.GetBondType()),
            'is_aromatic': bond.GetIsAromatic(),
            'is_in_ring': bond.IsInRing(),
            'stereo': str(bond.GetStereo()) if bond.GetStereo() else None
        })
    return bonds

def count_multiple_bonds(mol, atoms=None):
    """Count double and triple bonds in atom set."""
    double_count = 0
    triple_count = 0

    for bond in mol.GetBonds():
        if atoms and not (bond.GetBeginAtomIdx() in atoms and
                         bond.GetEndAtomIdx() in atoms):
            continue

        if bond.GetBondType() == Chem.BondType.DOUBLE:
            double_count += 1
        elif bond.GetBondType() == Chem.BondType.TRIPLE:
            triple_count += 1

    return double_count, triple_count
```

## 8. Substructure Matching

```python
def match_substructure(mol, smarts):
    """Match SMARTS pattern and return all matches."""
    pattern = Chem.MolFromSmarts(smarts)
    if pattern is None:
        raise ValueError(f"Invalid SMARTS: {smarts}")

    matches = mol.GetSubstructMatches(pattern)
    return list(matches)

def get_canonical_atom_order(mol):
    """Get canonical atom ordering for consistent naming."""
    return list(Chem.CanonicalRankAtoms(mol))
```

---

**References:**
- [RDKit Documentation](https://www.rdkit.org/docs/)
- [RDKit Cookbook](https://www.rdkit.org/docs/Cookbook.html)
- [SMARTS Tutorial](https://www.daylight.com/dayhtml/doc/theory/theory.smarts.html)
