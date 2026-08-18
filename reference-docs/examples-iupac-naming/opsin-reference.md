# OPSIN Reference Guide (for structure→name engines)

**Purpose:** How to use OPSIN codebase as reference for structure-to-name generation

**Source:** OPSIN GitHub (https://github.com/dan2097/opsin)

---

## 1. OPSIN Overview

OPSIN converts IUPAC names to structures (name → structure).
A structure→name engine does the inverse (structure → name).

**Key Insight:** Reverse OPSIN's parsing logic for generation.

```
OPSIN:     Name → Tokenize → Parse → Build Structure
Structure→name engine: Structure → Perceive → Classify → Assemble Name
```

## 2. OPSIN Directory Structure

```
opsin/opsin-core/src/main/resources/uk/ac/cam/ch/wwmm/opsin/resources/
├── groupStemNames.xml      # Chain length prefixes (meth, eth, prop...)
├── suffixes.xml            # Suffix transformation rules
├── suffixApplicability.xml # When suffixes apply
├── hantzschWidman.xml      # Heterocycle naming tables
├── hwHeteroAtoms.xml       # HW heteroatom prefixes
├── hwSuffixes.xml          # HW ring size suffixes
├── ringAssemblies.xml      # Fused ring names
├── functionalTerms.xml     # Functional group terms
├── tokenLists.dtd          # Token grammar definition
└── simpleGroups.xml        # Simple retained names
```

## 3. Key Resource Files

### groupStemNames.xml - Chain Prefixes

```xml
<!-- Maps chain length to prefix -->
<group value="1" type="chain">meth</group>
<group value="2" type="chain">eth</group>
<group value="3" type="chain">prop</group>
<group value="4" type="chain">but</group>
<group value="5" type="chain">pent</group>
<!-- ... through 40+ -->
```

**Typical implementation:** a dedicated data/rules module

### suffixes.xml - Functional Group Suffixes

```xml
<!-- Suffix definitions with type and transformation -->
<suffix value="ol" type="primaryOHSubstituent" />
<suffix value="al" type="aldehyde" />
<suffix value="one" type="ketone" />
<suffix value="oic acid" type="carboxylicAcid" />
<suffix value="amine" type="amine" />
```

**Typical implementation:** a dedicated data/rules module

### hantzschWidman.xml - Heterocycle Naming

```xml
<!-- HW ring size suffixes -->
<hwSuffix size="3" saturated="irane" unsaturated="irene" />
<hwSuffix size="4" saturated="etane" unsaturated="ete" />
<hwSuffix size="5" saturated="olane" unsaturated="ole" />
<hwSuffix size="6" saturated="ane" unsaturated="ine" />
<!-- Note: 6-membered has special N-variant "inane" -->
```

**Typical implementation:** a dedicated data/rules module

### hwHeteroAtoms.xml - Heteroatom Prefixes

```xml
<!-- Heteroatom 'a' term prefixes with priority -->
<hwPrefix element="O" prefix="oxa" priority="1" />
<hwPrefix element="S" prefix="thia" priority="2" />
<hwPrefix element="N" prefix="aza" priority="5" />
<hwPrefix element="Si" prefix="sila" priority="10" />
```

**Typical implementation:** a dedicated data/rules module

### simpleGroups.xml - Retained Names

```xml
<!-- Trivial/retained names for common structures -->
<group value="benzene" SMILES="c1ccccc1" />
<group value="toluene" SMILES="Cc1ccccc1" />
<group value="furan" SMILES="c1ccoc1" />
<group value="pyridine" SMILES="c1ccncc1" />
```

**Typical implementation:** a dedicated data/rules module

## 4. How to Use OPSIN as Reference

### Finding Naming Rules

When implementing a new compound class:

1. **Find relevant XML file:**
   ```bash
   grep -r "yourterm" opsin/opsin-core/src/main/resources/
   ```

2. **Trace the Java parsing logic:**
   ```bash
   # Find where a term is processed
   grep -r "yourterm" opsin/opsin-core/src/main/java/ --include="*.java"
   ```

3. **Check test cases:**
   ```bash
   # OPSIN tests show expected name→structure mappings
   grep -r "yourterm" opsin/opsin-core/src/test/ --include="*.java"
   ```

### Extracting Data Tables

```python
# Example: Parse OPSIN XML for chain prefixes
import xml.etree.ElementTree as ET

tree = ET.parse('opsin/opsin-core/src/main/resources/.../groupStemNames.xml')
root = tree.getroot()

prefixes = {}
for group in root.findall('.//group[@type="chain"]'):
    length = int(group.get('value'))
    prefix = group.text
    prefixes[length] = prefix
```

### Validation with OPSIN

```python
# Round-trip validation
from opsin import name_to_structure

def validate_roundtrip(smiles, generated_name):
    """Check if OPSIN can parse our generated name back to same structure."""
    try:
        opsin_smiles = name_to_structure(generated_name)
        return Chem.CanonSmiles(smiles) == Chem.CanonSmiles(opsin_smiles)
    except:
        return False
```

## 5. Key OPSIN Java Classes (Reference)

### Parsing Pipeline

| Class | Purpose | Typical module |
|-------|---------|---------------------|
| NameToStructure | Main entry point | namer.py |
| Tokeniser | Name tokenization | (inverse: assembly) |
| ComponentProcessor | Component handling | (inverse: perception) |
| FragmentBuilder | Structure assembly | (inverse: classification) |
| SuffixApplier | Suffix processing | rules/seniority.py |

### Useful Patterns in OPSIN Code

```java
// OPSIN's seniority ordering (from SuffixApplier.java)
// Study this to understand suffix priority
private static final String[] SUFFIX_PRIORITY = {
    "carboxylicAcid", "ester", "acylHalide", "amide",
    "nitrile", "aldehyde", "ketone", "alcohol", "amine"
};
```

## 6. Common Reference Lookups

### Multiplicative Prefixes

```xml
<!-- From OPSIN multipliers -->
<multiplier value="2">di</multiplier>
<multiplier value="3">tri</multiplier>
<multiplier value="4">tetra</multiplier>
<multiplier value="5">penta</multiplier>
<!-- Complex (for substituents with locants) -->
<multiplier value="2" type="complex">bis</multiplier>
<multiplier value="3" type="complex">tris</multiplier>
```

### Ring System Names

```xml
<!-- From ringAssemblies.xml -->
<ring name="naphthalene" SMILES="c1ccc2ccccc2c1" />
<ring name="anthracene" SMILES="c1ccc2cc3ccccc3cc2c1" />
<ring name="phenanthrene" SMILES="c1ccc2c(c1)ccc3ccccc32" />
```

### Fused Ring Descriptors

```xml
<!-- Fusion notation examples -->
<fusedRing parent="naphthalene" attached="benzo" descriptor="[a]" />
<fusedRing parent="furan" attached="naphtho" descriptor="[2,3-b]" />
```

## 7. Debugging with OPSIN

### Test Name Parsing

```bash
# Run OPSIN from command line
java -jar opsin.jar "2-methylpropan-1-ol"
# Output: CC(C)CO

# Verbose mode for debugging
java -jar opsin.jar -v "cyclohexane-1,4-diol"
```

### Comparing Outputs

```python
def debug_naming(smiles):
    """Compare the naming engine output with OPSIN parsing."""
    # Generate name with the naming engine
    name = name_engine.name(smiles)
    print(f"Generated: {name}")

    # Validate with OPSIN
    opsin_smiles = opsin.name_to_structure(name)
    print(f"OPSIN parsed: {opsin_smiles}")

    # Check canonical match
    original = Chem.CanonSmiles(smiles)
    parsed = Chem.CanonSmiles(opsin_smiles)

    if original == parsed:
        print("✓ Round-trip successful")
    else:
        print(f"✗ Mismatch: {original} vs {parsed}")
```

## 8. OPSIN Limitations to Note

| Feature | OPSIN Support | Notes |
|---------|---------------|-------|
| Basic IUPAC | Full | All standard nomenclature |
| CAS names | Partial | Some variants accepted |
| Common names | Good | Many trivial names |
| Stereochemistry | Good | R/S, E/Z, cis/trans |
| Natural products | Limited | Some steroid names |
| Peptides | Basic | Simple sequences |

---

**References:**
- [OPSIN GitHub](https://github.com/dan2097/opsin)
- [OPSIN Paper](https://pubs.acs.org/doi/10.1021/ci100384d)
- [OPSIN Web Demo](https://opsin.ch.cam.ac.uk/)
