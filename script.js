// 1. Supabase konfiguráció a te projektadataid alapján
const SUPABASE_URL = "https://lviqqzphrrosqazvdlzx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_tqfvpNy5Nh-watSJQLU8ZA_-2yXNTXM";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

document.addEventListener("DOMContentLoaded", () => {
    const autoLista = document.getElementById("auto-lista");
    const autoSelect = document.getElementById("auto");
    const berlesForm = document.getElementById("berles-form");

    // --- 1. AUTÓK DINAMIKUS BETÖLTÉSE ---
    async function autokBetoltese() {
        if (!autoLista) return;

        const { data: autok, error } = await supabase
            .from('autok')
            .select('*');

        if (error) {
            console.error("Hiba az autók lekérésekor:", error);
            autoLista.innerHTML = "<p style='color:red; text-align:center; grid-column: 1/-1;'>Nem sikerült betölteni az autókat!</p>";
            return;
        }

        autoLista.innerHTML = ""; 
        if (autoSelect) autoSelect.innerHTML = ""; 

        if (!autok || autok.length === 0) {
            autoLista.innerHTML = "<p style='color:white; text-align:center; grid-column: 1/-1;'>Nincsenek autók az adatbázisban.</p>";
            return;
        }

        autok.forEach(auto => {
            // Teljes név összefűzése a különálló oszlopokból
            const autoTeljesNev = `${auto.marka} ${auto.tipus}`;

            // Kártyák generálása
            const kartya = document.createElement("div");
            kartya.className = "kartya";
            kartya.innerHTML = `
                <img src="${auto.kep_url}" alt="${autoTeljesNev}">
                <h3>${autoTeljesNev}</h3>
                <p>Évjárat: ${auto.evjarat}</p>
                <div class="ar">${Number(auto.ar_per_nap).toLocaleString()} Ft / nap</div>
                <a href="#foglalas"><button style="width: 80%;" onclick="valasztottAutoBeallitas('${auto.id}')">Kiválasztom</button></a>
            `;
            autoLista.appendChild(kartya);

            // Legördülő menü feltöltése (az értéke az autó ID-ja lesz!)
            if (autoSelect) {
                const opcio = document.createElement("option");
                opcio.value = auto.id; 
                opcio.textContent = autoTeljesNev;
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
            const autoId = document.getElementById("auto").value;
            const kezdo_datum = document.getElementById("kezdo").value;
            const zaro_datum = document.getElementById("zaro").value;

            // Első lépés: Ügyfél elmentése az 'ugyfelek' táblába
            const { data: ujUgyfel, error: ugyfelError } = await supabase
                .from('ugyfelek')
                .insert([{ nev: nev, email: email }])
                .select();

            if (ugyfelError) {
                console.error("Ügyfél mentési hiba:", ugyfelError);
                alert("Hiba történt a bérlő adatainak mentésekor.");
                return;
            }

            const ugyfelId = ujUgyfel[0].id;

            // Második lépés: Foglalás mentése a 'foglalasok' (ékezet nélkül!) táblába
            const { error: foglalasError } = await supabase
                .from('foglalasok')
                .insert([
                    { 
                        auto_id: autoId, 
                        ugyfel_id: ugyfelId, 
                        mettol: kezdo_datum, 
                        meddig: zaro_datum,
                        osszar: 0 // Ezt később lehetne finomítani a napok száma alapján
                    }
                ]);

            if (foglalasError) {
                console.error("Foglalási hiba:", foglalasError);
                alert("Hiba történt a foglalás mentésekor: " + foglalasError.message);
            } else {
                alert(`Sikeres foglalás! 🦆\nKöszönjük ${nev}, rögzítettük a Supabase-ben.`);
                berlesForm.reset(); 
            }
        });
    }

    autokBetoltese();
});

// Globális segédfüggvény
window.valasztottAutoBeallitas = function(autoId) {
    const selectElem = document.getElementById("auto");
    if (selectElem) {
        selectElem.value = autoId;
    }
}