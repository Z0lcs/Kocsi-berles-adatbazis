# Autókölcsönző Adatbázis Rendszer

Ez a projekt egy iskolai szoftverfejlesztési feladat keretében készült, amelynek célja egy autó-kölcsönző nyilvántartó rendszer létrehozása. A rendszer lehetővé teszi az autók adatainak kezelését és a bérlési folyamatok nyomon követését.

## 🛠 Technológiai stack
* **Frontend:** HTML, JavaScript
* **Backend/Adatbázis:** Supabase (PostgreSQL)
* **Verziókezelés:** Git & GitHub

## 📂 Adatbázis szerkezet
A rendszer a következő fő adatbázis táblákat használja:
* **`cars`**: Tartalmazza az autók adatait (típus, rendszám, évjárat, elérhetőség).
* **`customers`**: A bérlők személyes adatai.
* **`rentals`**: A konkrét bérlési tranzakciók (melyik ügyfél, melyik autót, mikor vitte el).

## 🚀 Telepítés
1. Klónozd a projektet:
   `git clone https://github.com/Z0lcs/Kocsi-berles-adatbazis.git`
2. Konfiguráld a Supabase elérést:
   * Hozz létre egy `.env` fájlt a projekt gyökerében.
   * Add meg a Supabase URL-t és a publikus kulcsot (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).
3. Nyisd meg az `index.html` fájlt a böngésződben (vagy futtasd fejlesztői szerverrel).

## 💡 Hogyan működik (Példa)
A rendszerben az autók lekérdezése így történik a Supabase kliens segítségével:

```javascript
const { data, error } = await supabase
  .from('cars')
  .select('*')
  .eq('available', true); // Csak az elérhető autók listázása
```
## 👥 Fejlesztők
A projektet a Mechwart András Gépipari és Informatikai Technikum diákjai fejlesztették egy csapatmunka keretében.
