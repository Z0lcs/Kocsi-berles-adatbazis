const SUPABASE_URL = "https://lviqqzphrrosqazvdlzx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_tqfvpNy5Nh-watSJQLU8ZA_-2yXNTXM";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aXFxenBocnJvc3FhenZkbHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NzIyNjgsImV4cCI6MjA5NTQ0ODI2OH0.ac-MzRrnqytQBJN5CCHNAbAAN4RU4Yhnc6AdXBqlnAU";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Globális: autó kiválasztása kártyáról → beállítja a select-et és scrollol a formhoz
window.valasztottAutoBeallitas = function (autoId) {
    const selectElem = document.getElementById("auto");
    if (selectElem) {
        selectElem.value = autoId;
        document.querySelector("#foglalas").scrollIntoView({ behavior: 'smooth' });
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const autoLista    = document.getElementById("auto-lista");
    const berlesForm   = document.getElementById("berles-form");
    const autoSelect   = document.getElementById("auto");
    const kezdoInput   = document.getElementById("kezdo");
    const zaroInput    = document.getElementById("zaro");
    const arMegjelenit = document.getElementById("ar-megjelenitese"); 

    // --- Dátum minimum: ma ---
    const ma = new Date().toISOString().split("T")[0];
    if (kezdoInput) kezdoInput.min = ma;
    if (zaroInput)  zaroInput.min  = ma;

    // Kezdő dátum változásakor a záró min értékét is frissítjük
    if (kezdoInput) {
        kezdoInput.addEventListener("change", () => {
            if (zaroInput) {
                zaroInput.min = kezdoInput.value;
                if (zaroInput.value && zaroInput.value < kezdoInput.value) {
                    zaroInput.value = "";
                }
            }
            szamitsArt();
        });
    }
    if (zaroInput)  zaroInput.addEventListener("change", szamitsArt);
    if (autoSelect) autoSelect.addEventListener("change", szamitsArt);

    // --- Ár kiszámítása és megjelenítése ---
    function szamitsArt() {
        if (!kezdoInput?.value || !zaroInput?.value || !autoSelect?.value) return;

        const kezdoDatum = new Date(kezdoInput.value);
        const zaroDatum  = new Date(zaroInput.value);
        const napokSzama = Math.ceil((zaroDatum - kezdoDatum) / (1000 * 60 * 60 * 24));

        if (napokSzama <= 0) return;

        // Kikeressük a kiválasztott autó árát a DOM-ból (data-ar attribútumból)
        const kivalasztottOption = autoSelect.options[autoSelect.selectedIndex];
        const arPerNap = parseFloat(kivalasztottOption?.dataset?.ar || 0);
        const osszAr = arPerNap * napokSzama;

        if (arMegjelenit) {
            arMegjelenit.textContent = osszAr > 0
                ? `Becsült összeg: ${osszAr.toLocaleString("hu-HU")} Ft (${napokSzama} nap × ${arPerNap.toLocaleString("hu-HU")} Ft)`
                : "";
        }
    }

    // --- Autók betöltése Supabase-ből ---
    async function autokBetoltese() {
        if (!autoLista) return;
        autoLista.innerHTML = "<p style='color:white;text-align:center;'>Autók betöltése...</p>";

        const { data: autok, error } = await supabaseClient
            .from("autok")
            .select("*")
            .order("marka");

        if (error) {
            console.error("Autók betöltési hiba:", error);
            autoLista.innerHTML = "<p style='color:red;text-align:center;'>Hiba az autók betöltésekor. Ellenőrizd a Supabase kulcsot!</p>";
            return;
        }

        autoLista.innerHTML = "";
        autoSelect.innerHTML = '<option value="">Válassz autót...</option>';

        autok.forEach(auto => {
            const elerheto     = auto.elerheto;
            const teljesNev    = `${auto.marka} ${auto.tipus}`;
            const arFormazott  = Number(auto.ar_per_nap).toLocaleString("hu-HU");

            // Kártya
            const kartya = document.createElement("div");
            kartya.className = `kartya${!elerheto ? " foglalt" : ""}`;
            kartya.innerHTML = `
                <img src="${auto.kep_url || 'https://placehold.co/400x220/1a1a2e/white?text=Nincs+kép'}" 
                     alt="${teljesNev}" 
                     onerror="this.src='https://placehold.co/400x220/1a1a2e/white?text=Nincs+kép'">
                <h3>${teljesNev}</h3>
                <p>Évjárat: ${auto.evjarat}</p>
                <div class="ar">${arFormazott} Ft / nap</div>
                ${!elerheto
                    ? '<button disabled>Foglalt</button>'
                    : `<button onclick="valasztottAutoBeallitas('${auto.id}')">Kiválasztom</button>`
                }
            `;
            autoLista.appendChild(kartya);

            // Select option (csak elérhető autók)
            if (elerheto) {
                const option = document.createElement("option");
                option.value = auto.id;
                option.textContent = teljesNev;
                option.dataset.ar = auto.ar_per_nap; // ár tárolása az árszámításhoz
                autoSelect.appendChild(option);
            }
        });
    }

    // --- Ügyfél keresése vagy létrehozása (email alapján) ---
    async function ugyfelMegtalalaVagyLetrehozas(nev, email) {
        // Próbáljuk megtalálni a meglévő ügyfelet email alapján
        const { data: meglevo, error: keresesError } = await supabaseClient
            .from("ugyfelek")
            .select("id")
            .eq("email", email)
            .maybeSingle();

        if (keresesError) throw new Error("Hiba az ügyfél keresésekor: " + keresesError.message);

        if (meglevo) return meglevo.id; // Már létező ügyfél

        // Új ügyfél létrehozása
        const { data: ujUgyfel, error: letrehozasError } = await supabaseClient
            .from("ugyfelek")
            .insert([{ nev, email }])
            .select("id")
            .single();

        if (letrehozasError) throw new Error("Hiba az ügyfél mentésekor: " + letrehozasError.message);
        return ujUgyfel.id;
    }

    // --- Összár kiszámítása ---
    function osszarKiszamitas(arPerNap, kezdo, zaro) {
        const kezdoDatum = new Date(kezdo);
        const zaroDatum  = new Date(zaro);
        const napok      = Math.ceil((zaroDatum - kezdoDatum) / (1000 * 60 * 60 * 24));
        return napok > 0 ? arPerNap * napok : 0;
    }

    // --- Foglalás form submit ---
    if (berlesForm) {
        berlesForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const nev    = document.getElementById("nev").value.trim();
            const email  = document.getElementById("email").value.trim();
            const autoId = document.getElementById("auto").value;
            const kezdo  = document.getElementById("kezdo").value;
            const zaro   = document.getElementById("zaro").value;

            // Dátum validáció
            if (new Date(zaro) <= new Date(kezdo)) {
                alert("A bérlés vége dátumnak a kezdete után kell lennie!");
                return;
            }

            const submitBtn = berlesForm.querySelector("button[type='submit']");
            submitBtn.disabled = true;
            submitBtn.textContent = "Feldolgozás...";

            try {
                // 1. Autó adatainak lekérése (árhoz)
                const { data: auto, error: autoError } = await supabaseClient
                    .from("autok")
                    .select("ar_per_nap, elerheto")
                    .eq("id", autoId)
                    .single();

                if (autoError || !auto) throw new Error("Az autó nem található.");
                if (!auto.elerheto) throw new Error("Ez az autó már nem elérhető.");

                // 2. Ügyfél mentése / megtalálása
                const ugyfelId = await ugyfelMegtalalaVagyLetrehozas(nev, email);

                // 3. Összár kiszámítása
                const osszar = osszarKiszamitas(Number(auto.ar_per_nap), kezdo, zaro);

                // 4. Foglalás mentése
                const { error: foglalasError } = await supabaseClient
                    .from("foglalasok")
                    .insert([{
                        auto_id:   autoId,
                        ugyfel_id: ugyfelId,
                        mettol:    kezdo,
                        meddig:    zaro,
                        osszar:    osszar
                    }]);

                if (foglalasError) throw new Error("Hiba a foglalásnál: " + foglalasError.message);

                // 5. Autó elérhetőségének frissítése
                const { error: updateError } = await supabaseClient
                    .from("autok")
                    .update({ elerheto: false })
                    .eq("id", autoId);

                if (updateError) throw new Error("Hiba az autó frissítésekor: " + updateError.message);

                alert(`✅ Sikeres foglalás!\n\nÖsszeg: ${osszar.toLocaleString("hu-HU")} Ft\nKöszönjük, ${nev}!`);
                berlesForm.reset();
                autokBetoltese();

            } catch (err) {
                console.error(err);
                alert("❌ Hiba: " + err.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = "Foglalás megerősítése";
            }
        });
    }


// --- Autók betöltése Supabase-ből ---
    // --- Autók betöltése Supabase-ből ---
    async function autokBetoltese() {
        if (!autoLista) return;
        
        const foglaltLista = document.getElementById("foglaltID");
        
        autoLista.innerHTML = "<p style='color:white;text-align:center;'>Autók betöltése...</p>";
        if (foglaltLista) {
            foglaltLista.innerHTML = "<h2>Foglalt autók</h2>"; 
        }

        // MÓDOSÍTÁS: Lekérjük az autókat, és velük együtt a hozzájuk tartozó foglalások 'meddig' dátumát is!
        const { data: autok, error } = await supabaseClient
            .from("autok")
            .select(`
                *,
                foglalasok (
                    meddig
                )
            `)
            .order("marka");

        if (error) {
            console.error("Autók betöltési hiba:", error);
            autoLista.innerHTML = "<p style='color:red;text-align:center;'>Hiba az autók betöltésekor. Ellenőrizd a Supabase kulcsot!</p>";
            return;
        }

        autoLista.innerHTML = "";
        autoSelect.innerHTML = '<option value="">Válassz autót...</option>';

        autok.forEach(auto => {
            const elerheto     = auto.elerheto;
            const teljesNev    = `${auto.marka} ${auto.tipus}`;
            const arFormazott  = Number(auto.ar_per_nap).toLocaleString("hu-HU");

            // MÓDOSÍTÁS: Megkeressük, meddig van lefoglalva (ha van hozzá foglalás)
            let foglaltSzoveg = "";
            if (!elerheto && auto.foglalasok && auto.foglalasok.length > 0) {
                // Ha több foglalás is lenne, a legutolsót vesszük alapul
                const utolsoFoglalas = auto.foglalasok[auto.foglalasok.length - 1];
                if (utolsoFoglalas.meddig) {
                    foglaltSzoveg = `<div class="foglalt-datum">Lefoglalva: ${utolsoFoglalas.meddig}-ig</div>`;
                }
            }

            // Kártya HTML generálása
            const kartya = document.createElement("div");
            kartya.className = `kartya${!elerheto ? " foglalt" : ""}`;
            kartya.innerHTML = `
                <img src="${auto.kep_url || 'https://placehold.co/400x220/1a1a2e/white?text=Nincs+kép'}" 
                     alt="${teljesNev}" 
                     onerror="this.src='https://placehold.co/400x220/1a1a2e/white?text=Nincs+kép'">
                <h3>${teljesNev}</h3>
                <p>Évjárat: ${auto.evjarat}</p>
                <div class="ar">${arFormazott} Ft / nap</div>
                
                <!-- Ide szúrjuk be a dátumot, ha foglalt -->
                ${foglaltSzoveg} 

                ${!elerheto
                    ? '<button disabled>Foglalt</button>'
                    : `<button onclick="valasztottAutoBeallitas('${auto.id}')">Kiválasztom</button>`
                }
            `;

            // Elosztás a két div között
            if (elerheto) {
                autoLista.appendChild(kartya);
                
                const option = document.createElement("option");
                option.value = auto.id;
                option.textContent = teljesNev;
                option.dataset.ar = auto.ar_per_nap;
                autoSelect.appendChild(option);
            } else {
                if (foglaltLista) {
                    foglaltLista.appendChild(kartya);
                }
            }
        });
    }


    autokBetoltese();
});