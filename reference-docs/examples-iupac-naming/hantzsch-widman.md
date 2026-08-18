# Hantzsch-Widman Nomenclature System

**Purpose:** Systematic naming of monocyclic heterocycles with 3-10 members

**Source:** IUPAC 2013 Blue Book P-22.2.2, Tables 2.2-2.3

---

## 1. System Overview

The Hantzsch-Widman (HW) system provides systematic names for heterocycles:

```
[locant(s)]-[heteroatom prefix(es)]-[stem suffix]

Examples:
- oxirane (3-membered O ring, saturated)
- 1,3-oxazole (5-membered O,N ring, unsaturated)
- 1,4-dioxane (6-membered 2xO ring, saturated)
```

## 2. Heteroatom Prefixes ('a' terms)

### Priority Order (highest to lowest)
Higher priority heteroatom gets position 1 in numbering.

| Priority | Element | Prefix | Group |
|----------|---------|--------|-------|
| 1 | O | oxa | 16 |
| 2 | S | thia | 16 |
| 3 | Se | selena | 16 |
| 4 | Te | tellura | 16 |
| 5 | N | aza | 15 |
| 6 | P | phospha | 15 |
| 7 | As | arsa | 15 |
| 8 | Sb | stiba | 15 |
| 9 | Bi | bisma | 15 |
| 10 | Si | sila | 14 |
| 11 | Ge | germa | 14 |
| 12 | Sn | stanna | 14 |
| 13 | Pb | plumba | 14 |
| 14 | B | bora | 13 |

### Multiplicative Prefixes for Heteroatoms
- 2 identical: di- (dioxa, diaza)
- 3 identical: tri- (trioxa, triaza)
- 4 identical: tetra- (tetraoxa, tetraaza)

## 3. Stem Suffixes by Ring Size

### Unsaturated Stems (maximum unsaturation)

| Size | Suffix | Example | Common Name |
|------|--------|---------|-------------|
| 3 | -irene | oxirene | - |
| 4 | -ete | oxete | - |
| 5 | -ole | oxole | furan |
| 6 | -ine | oxine | pyran |
| 7 | -epine | oxepine | - |
| 8 | -ocine | oxocine | - |
| 9 | -onine | oxonine | - |
| 10 | -ecine | oxecine | - |

### Saturated Stems

| Size | O,S,Se,Te | N,P,Si,B | Example |
|------|-----------|----------|---------|
| 3 | -irane | -iridine | oxirane, aziridine |
| 4 | -etane | -etidine | oxetane, azetidine |
| 5 | -olane | -olidine | oxolane, pyrrolidine* |
| 6 | -ane | -inane | oxane, azinane* |
| 7 | -epane | -epane | oxepane, azepane |
| 8 | -ocane | -ocane | oxocane, azocane |
| 9 | -onane | -onane | oxonane, azonane |
| 10 | -ecane | -ecane | oxecane, azecane |

*Many N-saturated rings have retained names (piperidine, morpholine)

## 4. Ring Numbering Rules

### Basic Algorithm
1. Start from highest-priority heteroatom (position 1)
2. Number to give lowest locants to other heteroatoms
3. If still ambiguous, lowest locants for substituents

### Multiple Heteroatom Examples

```
1,3-oxazole:
    O at position 1 (higher priority)
    N at position 3

    1   2
     \ /
      O
     / \
    5   3-N
     \ /
      4

1,4-dioxane:
    O O at positions 1 and 4

      1-O   2
        \ /
    6    \
    /     3
   O-5   /
        4
```

## 5. Indicated Hydrogen

For rings that can have tautomeric forms:

```
1H-pyrrole:   H at position 1 (N)
2H-pyrrole:   H at position 2 (C)
4H-pyran:     H at position 4
2H-pyran:     H at position 2
```

**Rule:** Indicated H shows where the "extra" hydrogen is located

## 6. Retained Names (Check FIRST)

These names override HW systematic names:

| SMILES | Retained Name | HW Systematic |
|--------|---------------|---------------|
| c1ccoc1 | furan | oxole |
| c1cc[nH]c1 | pyrrole | azole |
| c1ccsc1 | thiophene | thiole |
| c1ccncc1 | pyridine | azine |
| c1cncnc1 | pyrimidine | 1,3-diazine |
| c1ccncc1 | pyrazine | 1,4-diazine |
| C1CCOCC1 | tetrahydropyran | oxane |
| C1CCNCC1 | piperidine | azinane |
| C1COCCN1 | morpholine | 1,4-oxazinane |

## 7. Implementation notes

### Naming Algorithm

```python
def name_hw_heterocycle(mol, ring_atoms):
    """
    1. Check retained names FIRST
    2. Identify heteroatoms and their positions
    3. Sort heteroatoms by IUPAC priority
    4. Assign locants starting from highest priority
    5. Select stem suffix based on ring size + saturation
    6. Combine: [locants]-[prefixes]-[stem]
    """

    # Step 1: Check retained names
    retained = check_retained_heterocycle(mol)
    if retained:
        return retained

    # Step 2-4: Get heteroatom info
    heteroatoms = get_ring_heteroatoms(mol, ring_atoms)
    sorted_hetero = sort_by_priority(heteroatoms)
    locants = assign_locants(ring_atoms, sorted_hetero)

    # Step 5: Get stem
    ring_size = len(ring_atoms)
    is_saturated = is_ring_saturated(mol, ring_atoms)
    principal_hetero = sorted_hetero[0][0]  # Element symbol
    stem = get_hw_stem(ring_size, is_saturated, principal_hetero)

    # Step 6: Build name
    prefix = build_heteroatom_prefix(locants, sorted_hetero)
    return f"{prefix}{stem}"
```

### Locant Format

```python
def format_hw_locants(heteroatom_positions):
    """
    Format locants for HW names:
    - Single heteroatom: no locant prefix
    - Multiple identical: 1,3-dioxa
    - Multiple different: 1-oxa-3-aza or 1,3-oxaza
    """
```

## 8. Edge Cases

### Unsaturation Position
For partially saturated rings, indicate H position:
- 2,3-dihydrofuran
- 3,4-dihydro-2H-pyran
- 1,2,3,4-tetrahydropyridine

### Benzo-Fused HW Rings
When HW ring is fused to benzene:
- benzo[b]furan (not benzofuran)
- benzo[c]furan
- Check fused_heterocycles.py for retained fused names

---

**References:**
- [IUPAC Blue Book P-22.2](https://iupac.qmul.ac.uk/BlueBook/P2.html#2202)
- [Hantzsch-Widman Tables](https://old.iupac.org/publications/books/rbook/Red_Book_2005.pdf)
