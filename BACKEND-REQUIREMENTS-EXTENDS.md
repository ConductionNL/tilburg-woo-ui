# 🔧 BACKEND REQUIREMENTS VOOR STANDAARDEN KOPPELING

## 📋 CONTEXT

De "Applicatie Aanmelden" wizard moet de volledige keten tonen:
**Referentiecomponenten → Standaarden → Standaardversies**

De frontend is nu aangepast om met de `_extend` parameters te werken volgens een twee-staps proces.

---

## ✅ FRONTEND IMPLEMENTATIE (VOLTOOID)

### Nieuwe Flow:

#### Stap 1: Referentiecomponenten laden met standaarden
```javascript
GET /openregister/api/objects/vng-gemma/element?
  _limit=500&
  _page=1&
  gemmaType=Referentiecomponent&
  _extend[]=@self.schema&
  _extend[]=aanbevolenStandaarden&
  _extend[]=verplichteStandaarden&
  _published=false
```

#### Stap 2: Voor elke unieke standaard ID uit stap 1
```javascript
GET /openregister/api/objects/vng-gemma/element/{standaard-id}?
  _extend[]=standaardVersies
```

---

## 🚨 WAT DE BACKEND MOET LEVEREN

### 1. Referentiecomponent Response (Stap 1)

**Verwachte structuur:**
```json
{
  "results": [
    {
      "@self": {
        "id": "2c2289cf-0517-4726-aa10-7a2c6da2d495",
        "name": "Basisregistratie Personen"
      },
      "aanbevolenStandaarden": [
        {
          "@self": {
            "id": "standaard-uuid-1",
            "name": "DigiD"
          },
          // Andere standaard properties...
        },
        {
          "@self": {
            "id": "standaard-uuid-2",
            "name": "StUF-BG"
          }
        }
      ],
      "verplichteStandaarden": [
        {
          "@self": {
            "id": "standaard-uuid-3",
            "name": "SOAP"
          }
        }
      ]
    }
  ]
}
```

**❌ NIET acceptabel:**
```json
{
  "aanbevolenStandaarden": [
    "standaard-uuid-1",  // ← Alleen ID strings is NIET genoeg
    "standaard-uuid-2"
  ]
}
```

**✅ VEREIST:**
- `aanbevolenStandaarden` moet een array van **volledige objecten** zijn
- `verplichteStandaarden` moet een array van **volledige objecten** zijn
- Elk object moet minimaal `@self.id` en `@self.name` bevatten

---

### 2. Standaard Response met StandaardVersies (Stap 2)

**Verwachte structuur:**
```json
{
  "@self": {
    "id": "standaard-uuid-1",
    "name": "DigiD"
  },
  "standaardVersies": [
    {
      "@self": {
        "id": "versie-uuid-1",
        "name": "DigiD 3.0"
      },
      "versienummer": "3.0",
      "identifier": "id-digid-3-0"
    },
    {
      "@self": {
        "id": "versie-uuid-2",
        "name": "DigiD 4.0"
      },
      "versienummer": "4.0",
      "identifier": "id-digid-4-0"
    }
  ]
}
```

**❌ NIET acceptabel:**
```json
{
  "standaardVersies": [
    "versie-uuid-1",  // ← Alleen ID strings is NIET genoeg
    "versie-uuid-2"
  ]
}
```

**✅ VEREIST:**
- `standaardVersies` moet een array van **volledige objecten** zijn
- Elk object moet minimaal `@self.id` en `@self.name` bevatten
- Bij voorkeur ook `identifier` voor persistentie

---

## 📊 WAAROM DIT NODIG IS

### Probleem zonder extends:
```javascript
// Backend geeft alleen IDs terug:
{
  "aanbevolenStandaarden": ["uuid-1", "uuid-2", "uuid-3"]
}

// Frontend kan geen namen tonen → dropdowns tonen "Standaard 1", "Standaard 2"
```

### Oplossing met extends:
```javascript
// Backend geeft volledige objecten terug:
{
  "aanbevolenStandaarden": [
    { "@self": { "id": "uuid-1", "name": "DigiD" } },
    { "@self": { "id": "uuid-2", "name": "StUF-BG" } }
  ]
}

// Frontend kan echte namen tonen → dropdowns tonen "DigiD", "StUF-BG"
```

---

## 🧪 TEST ENDPOINTS

### Test 1: Referentiecomponent met standaarden
```bash
curl "http://localhost:3000/api/apps/openregister/api/objects/vng-gemma/element/2c2289cf-0517-4726-aa10-7a2c6da2d495?_extend[]=aanbevolenStandaarden&_extend[]=verplichteStandaarden"
```

**Verwacht:**
- `aanbevolenStandaarden` is een array van **objecten** (niet strings)
- `verplichteStandaarden` is een array van **objecten** (niet strings)
- Elk object heeft `@self.id` en `@self.name`

### Test 2: Standaard met standaardVersies
```bash
# Gebruik een standaard-id uit Test 1
curl "http://localhost:3000/api/apps/openregister/api/objects/vng-gemma/element/{standaard-id}?_extend[]=standaardVersies"
```

**Verwacht:**
- `standaardVersies` is een array van **objecten** (niet strings)
- Elk object heeft `@self.id` en `@self.name`

---

## 📝 SAMENVATTING VOOR BACKEND TEAM

**Actie vereist:**

1. ✅ Zorg dat `_extend[]=aanbevolenStandaarden` de **volledige standaard objecten** teruggeeft
2. ✅ Zorg dat `_extend[]=verplichteStandaarden` de **volledige standaard objecten** teruggeeft
3. ✅ Zorg dat `_extend[]=standaardVersies` de **volledige standaardversie objecten** teruggeeft
4. ❌ Geef NIET alleen ID strings terug bij extends

**Minimale velden per object:**
- `@self.id` (vereist voor identificatie)
- `@self.name` (vereist voor display in UI)
- `identifier` (aanbevolen voor persistentie)

---

## 💻 FRONTEND STATUS

✅ **Voltooid:**
- `ac-forms-applicatie.js` - Twee-staps proces geïmplementeerd
- Automatische cascade loading: RefComps → Standaarden → StandaardVersies
- Fallback naar "Component X", "Standaard X" indien geen naam gevonden
- Console logging voor debugging

⏳ **Nog te doen (na backend fix):**
- Testen van volledige flow in browser
- Eventueel dezelfde fix toepassen op andere wizards (product, gebruik, koppeling)

---

## 🔍 DEBUGGING

De frontend heeft uitgebreide console logging:

```javascript
// In browser console (F12):
// Zoek naar:
📋 Loading referentiecomponenten...
✅ Loaded X referentiecomponenten
📊 Found X unique standaarden from selected components
✅ Fetched X standaarden with their versions
📋 Extracting standaardversies from loaded standaarden...
⚠️ Standaard "..." has standaardVersies as IDs only, not full objects
```

Als je ziet:
```
⚠️ Standaard "..." has standaardVersies as IDs only, not full objects
```

Dan geeft de backend nog steeds alleen ID strings terug in plaats van volledige objecten.

---

**Contact:** Frontend implementatie door AI Agent @ `src/views/ac-forms/ac-forms-applicatie/ac-forms-applicatie.js`
