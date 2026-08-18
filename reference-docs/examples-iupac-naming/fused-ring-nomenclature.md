# Fused Ring Nomenclature - IUPAC Rules

**Purpose:** Peripheral numbering and fusion naming for polycyclic systems

**Source:** IUPAC 2013 Blue Book P-25, IUPAC 1998 Fused Ring Recommendations

---

## 1. Orientation Rules (Rule A-22)

Orient the polycyclic system so that:

1. **Maximum rings in horizontal row** - Greatest number of rings aligned horizontally
2. **Maximum rings in upper right quadrant** - Most rings above and to the right
3. **Minimum rings in lower left** - If still ambiguous, fewest rings in lower left

```
  ┌───┐         ← Upper right quadrant (maximize)
┌─┤   ├─┐
│ └─┬─┘ │       ← Horizontal row (maximize)
└───┴───┘
  ↑
  Lower left (minimize)
```

## 2. Peripheral Numbering Algorithm

### Starting Point
1. Select the **uppermost ring** in the oriented system
2. If multiple uppermost rings, select the **rightmost**
3. Start at the **non-fusion atom most counterclockwise** in that ring

### Direction
- Number **clockwise** around the periphery
- Include fusion heteroatoms in the count

### Fusion Atoms
- Fusion carbon atoms receive the **same number as preceding position**
- Add suffix: a, b, c, etc.
- Example: 4a, 8a (naphthalene), 4a, 9a (indole)

## 3. Naphthalene Numbering Example

```
    8   1
   ╱ ╲ ╱ ╲
  7   ╳   2      Numbering: 1,2,3,4,4a,5,6,7,8,8a
   ╲ ╱ ╲ ╱       Fusion atoms: 4a, 8a
    6   3
      ╲ ╱
       4
       │
      4a
```

## 4. Heterocyclic Fused Systems

### Indole (1H-indole) Numbering
```
    7   7a
   ╱ ╲ ╱ ╲
  6   ╳   1(N)   Positions: 1(N),2,3,3a,4,5,6,7,7a
   ╲ ╱ ╲ ╱       Tautomeric H at position 1
    5   2
      ╲ ╱
       4
       │
      3a
```

### Quinoline Numbering
```
    8   8a
   ╱ ╲ ╱ ╲
  7   ╳   1(N)   Positions: 1(N),2,3,4,4a,5,6,7,8,8a
   ╲ ╱ ╲ ╱       No tautomeric H (aromatic N)
    6   2
      ╲ ╱
       5
       │
      4a
```

### Purine (7H-purine) Numbering
```
       N1
      ╱  ╲
     C2   C6         Positions: 1,2,3,4,5,6,7,8,9
    ╱      ╲         Heteroatoms: N1,N3,N7,N9
   N3      C5        Tautomeric H at position 7 or 9
    ╲    ╱  ╲
     C4─N9   N7      IUPAC PIN: 7H-purine (H at N7)
         ╲ ╱         Alternative: 9H-purine (H at N9)
          C8
```

## 5. Fusion Descriptors

### Format
```
[attached-component][fusion-locants]-[parent]

Examples:
- benzo[a]naphthalene - benzene fused at side 'a' of naphthalene
- naphtho[2,3-b]furan - naphthalene fused with atoms 2,3 at side 'b' of furan
- pyrido[2,3-d]pyrimidine - pyridine fused with atoms 2,3 at side 'd' of pyrimidine
```

### Edge Lettering
Edges of parent ring are labeled a, b, c... starting from bond 1-2:
```
Benzene:     Naphthalene:
    a            a b
   1─2          1─2─3
  f│ │b        h│   │c
   6─3          8   4
    e│d         g│   │d
     5            6─5
                  f e
```

## 6. Indicated Hydrogen

When a fused heterocycle has a tautomeric NH, indicate position:
- **1H-indole** - H at position 1 (N)
- **2H-indole** - H at position 2 (C)
- **7H-purine** - H at position 7 (N)
- **9H-purine** - H at position 9 (N)

**PIN Rule:** Use the most stable tautomer for PIN

## 7. Common Fused Heterocycle Names

| SMILES | Name | Notes |
|--------|------|-------|
| c1ccc2[nH]ccc2c1 | 1H-indole | benzo[b]pyrrole |
| c1ccc2ncccc2c1 | quinoline | benzo[b]pyridine |
| c1ccc2cnccc2c1 | isoquinoline | benzo[c]pyridine |
| c1ccc2[nH]cnc2c1 | 1H-benzimidazole | benzo[d]imidazole |
| c1ccc2occc2c1 | 1-benzofuran | benzo[b]furan |
| c1ccc2sccc2c1 | 1-benzothiophene | benzo[b]thiophene |
| c1ncnc2[nH]cnc12 | 7H-purine | imidazo[4,5-d]pyrimidine |

## 8. Tricyclic Systems

### Carbazole (9H-carbazole)
- dibenzo[b,d]pyrrole
- Tautomeric H at position 9

### Acridine
- dibenzo[b,e]pyridine
- No tautomeric H (aromatic N)

### Phenazine
- dibenzo[b,e]pyrazine
- No tautomeric H

## 9. Implementation Notes

### OPSIN Algorithm (Reference)
1. Transform to idealized grid aligned along longest row of rings
2. Apply quadrant rules (favor upper right)
3. Number from uppermost rightmost ring
4. Use peripheral numbering for atom assignment

### Implementation notes
```python
def number_fused_periphery(mol, ring_atoms):
    """
    1. Orient system (max horizontal, max upper-right)
    2. Find uppermost-rightmost ring
    3. Find non-fusion atom most counterclockwise
    4. Number clockwise around periphery
    5. Assign 'a' suffixes to fusion atoms
    """
    pass
```

---

**References:**
- [IUPAC Fused Ring Rules (FR-5.3)](https://iupac.qmul.ac.uk/fusedring/FR53.html)
- [Rule A-22 Numbering](https://www.acdlabs.com/iupac/nomenclature/79/r79_72.htm)
- [1998 IUPAC Recommendations](https://old.iupac.org/publications/pac/1998/pdf/7001x0143.pdf)
- [OPSIN GitHub](https://github.com/dan2097/opsin)
