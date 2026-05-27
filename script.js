// 1. Supabase konfiguráció a te projektadataid alapján
const SUPABASE_URL = "https://lviqqzphrrosqazvdlzx.supabase.co";
const SUPABASE_ANON_KEY = "sb_secret_eqqZN-GCSrdTFmEQ8dnnMg_SZCm8tv9";

// Böngészőbarát kliens inicializálása
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", () => {
    const autoLista = document.getElementById("auto-lista");
    const autoSelect = document.getElementById("auto");
    const berlesForm = document.getElementById("berles-form");

    // --- 1. AUTÓK DINAMIKUS BETÖLTÉSE ---
    async function autokBetoltese() {
        if (!autoLista) return;
        autoLista.innerHTML = "<p style='color:white; text-align:center; grid-column: 1/-1;'>Autók betöltése a Supabase felhőből...</p>";

        const { data: autok, error } = await supabase
            .from('autok')
            .select('*');

        if (error) {
            console.error("Hiba az autók lekérésekor:", error);
            autoLista.innerHTML = "<p style='color:red; text-align:center; grid-column: 1/-1;'>Nem sikerült betölteni az autókat az adatbázisból!</p>";
            return;
        }

        autoLista.innerHTML = ""; 
        if (autoSelect) autoSelect.innerHTML = ""; 

        if (!autok || autok.length === 0) {
            autoLista.innerHTML = "<p style='color:white; text-align:center; grid-column: 1/-1;'>Nincsenek autók az adatbázisban.</p>";
            return;
        }

        autok.forEach(auto => {
            // HTML Kártyák legenerálása az adatbázis adatai alapján
            const kartya = document.createElement("div");
            kartya.className = "kartya";
            kartya.innerHTML = `
                <img src="${auto.kep_url}" alt="${auto.marka_modell}">
                <h3>${auto.marka_modell}</h3>
                <p>${auto.leiras || ''}</p>
                <div class="ar">${Number(auto.ar_per_nap).toLocaleString()} Ft / nap</div>
                <a href="#foglalas"><button style="width: 80%;" onclick="valasztottAutoBeallitas('${auto.marka_modell}')">Kiválasztom</button></a>
            `;
            autoLista.appendChild(kartya);

            // Select legördülő menü opcióinak feltöltése
            if (autoSelect) {
                const opcio = document.createElement("option");
                opcio.value = auto.marka_modell;
                opcio.textContent = auto.marka_modell;
                autoSelect.appendChild(opcio);
            }
        });
    }

    // --- 2. FOGLALÁS ELMENTÉSE ---
    if (berlesForm) {
        berlesForm.addEventListener("submit", async (e) => {
            e.preventDefault(); 

            const nev = document.getElementById("nev").value;
            const email = document.getElementById("email").value;
            const auto_tipus = document.getElementById("auto").value;
            const kezdo_datum = document.getElementById("kezdo").value;
            const zaro_datum = document.getElementById("zaro").value;

            // Adat beszúrása a Supabase 'foglalások' nevű táblájába
            const { error } = await supabase
                .from('foglalások')
                .insert([
                    { 
                        nev: nev, 
                        email: email, 
                        auto_tipus: auto_tipus, 
                        kezdo_datum: kezdo_datum, 
                        zaro_datum: zaro_datum 
                    }
                ]);

            if (error) {
                console.error("Foglalási hiba:", error);
                alert("Hiba történt a mentés során: " + error.message);
            } else {
                alert(`Sikeres foglalás! 🦆\nKöszönjük ${nev}, a foglalást rögzítettük a Supabase-ben.`);
                berlesForm.reset(); 
            }
        });
    }

    // Alkalmazás indítása
    autokBetoltese();
});

// Globális segédfüggvény a kártyákon lévő "Kiválasztom" gombokhoz
function valasztottAutoBeallitas(autoNev) {
    const selectElem = document.getElementById("auto");
    if (selectElem) {
        selectElem.value = autoNev;
    }
}