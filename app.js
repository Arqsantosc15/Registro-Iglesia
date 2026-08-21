// ==========================================================
// CONTROL DE MIEMBROS Y ASISTENCIA
// app.js - VERSIÓN LIMPIA Y CORREGIDA
// ==========================================================


// ==========================================================
// 1. CONEXIÓN CON SUPABASE
// ==========================================================

const SUPABASE_URL =
    "https://kjpwrpqlscitxyszsjkk.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_npgkf0Z40ecE7deKI7hHiw_ntgm0CJJ";


let supabaseClient = null;


// Comprobar que la librería de Supabase fue cargada
if (window.supabase && typeof window.supabase.createClient === "function") {

    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

    console.log("✅ Supabase conectado correctamente.");

} else {

    console.error(
        "❌ No se encontró la librería de Supabase."
    );

    alert(
        "❌ No se pudo cargar Supabase.\n\n" +
        "Revise la conexión a Internet y el script de Supabase en index.html."
    );
}


// ==========================================================
// 2. FUNCIONES GENERALES
// ==========================================================

function escapeHTML(valor) {

    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function mostrarError(error) {

    console.error(error);

    if (error && error.message) {
        return error.message;
    }

    return String(error);
}


function fechaHoy() {

    const ahora = new Date();

    const año = ahora.getFullYear();

    const mes = String(
        ahora.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
        ahora.getDate()
    ).padStart(2, "0");

    return `${año}-${mes}-${dia}`;
}


function mesActual() {

    const ahora = new Date();

    const año = ahora.getFullYear();

    const mes = String(
        ahora.getMonth() + 1
    ).padStart(2, "0");

    return `${año}-${mes}`;
}


function obtenerDias(miembro) {

    const dias = [];

    if (miembro.lunes) {
        dias.push("Lunes");
    }

    if (miembro.martes) {
        dias.push("Martes");
    }

    if (miembro.miercoles) {
        dias.push("Miércoles");
    }

    if (miembro.jueves) {
        dias.push("Jueves");
    }

    if (miembro.viernes) {
        dias.push("Viernes");
    }

    if (miembro.sabado) {
        dias.push("Sábado");
    }

    if (miembro.domingo) {
        dias.push("Domingo");
    }

    return dias.join(", ");
}


function obtenerNombreDia(fecha) {

    const fechaObjeto =
        new Date(fecha + "T12:00:00");

    const numeroDia =
        fechaObjeto.getDay();

    return [
        "domingo",
        "lunes",
        "martes",
        "miercoles",
        "jueves",
        "viernes",
        "sabado"
    ][numeroDia];
}


// ==========================================================
// 3. ELEMENTOS DE LA PÁGINA
// ==========================================================

// Miembros

const memberForm =
    document.getElementById("memberForm");

const listaMiembros =
    document.getElementById("listaMiembros");

const buscar =
    document.getElementById("buscar");

const fotoInput =
    document.getElementById("foto");

const preview =
    document.getElementById("preview");


// Modal de edición

const modalEditar =
    document.getElementById("modalEditar");

const btnCerrarModal =
    document.getElementById("btnCerrarModal");

const btnCancelarEdicion =
    document.getElementById("btnCancelarEdicion");

const btnGuardarEdicion =
    document.getElementById("btnGuardarEdicion");

const editarId =
    document.getElementById("editarId");

const editarNombre =
    document.getElementById("editarNombre");

const editarTelefono =
    document.getElementById("editarTelefono");

const editarMinisterio =
    document.getElementById("editarMinisterio");

const editarFoto =
    document.getElementById("editarFoto");

const editarPreview =
    document.getElementById("editarPreview");

const formEditarMiembro =
    document.getElementById("formEditarMiembro");


// Asistencia

const fechaAsistencia =
    document.getElementById("fechaAsistencia");

const servicioAsistencia =
    document.getElementById("servicioAsistencia");

const btnCargarAsistencia =
    document.getElementById("btnCargarAsistencia");

const btnGuardarAsistencia =
    document.getElementById("btnGuardarAsistencia");

const listaAsistencia =
    document.getElementById("listaAsistencia");


// Estadísticas

const mesEstadistica =
    document.getElementById("mesEstadistica");

const anoEstadistica =
    document.getElementById("anoEstadistica");

const buscarEstadistica =
    document.getElementById("buscarEstadistica");

const btnCargarEstadisticas =
    document.getElementById("btnCargarEstadisticas");

const resultadoEstadisticas =
    document.getElementById("resultadoEstadisticas");


// Compatibilidad con versiones anteriores

const mesReporte =
    document.getElementById("mesReporte");

const btnVerReporte =
    document.getElementById("btnVerReporte");

const resultadoReporte =
    document.getElementById("resultadoReporte");

const resumenReporte =
    document.getElementById("resumenReporte");


// ==========================================================
// 4. COMPROBAR SUPABASE
// ==========================================================

function supabaseDisponible() {

    if (!supabaseClient) {

        alert(
            "❌ Supabase no está disponible.\n\n" +
            "Revise index.html."
        );

        return false;
    }

    return true;
}


// ==========================================================
// 5. VISTA PREVIA DE FOTO
// ==========================================================

if (fotoInput && preview) {

    fotoInput.addEventListener(
        "change",
        function () {

            const archivo =
                fotoInput.files[0];

            if (!archivo) {

                preview.src = "";

                preview.style.display =
                    "none";

                return;
            }

            preview.src =
                URL.createObjectURL(archivo);

            preview.style.display =
                "block";
        }
    );
}


// ==========================================================
// 6. SUBIR FOTO A SUPABASE
// ==========================================================

async function subirFoto(
    archivo,
    prefijo = "miembro"
) {

    if (!archivo) {
        return null;
    }

    const extension =
        archivo.name
            .split(".")
            .pop()
            .toLowerCase();

    const nombreArchivo =
        prefijo +
        "-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2) +
        "." +
        extension;


    const {
        error: uploadError
    } = await supabaseClient
        .storage
        .from("Fotos-Miembros")
        .upload(
            nombreArchivo,
            archivo
        );


    if (uploadError) {
        throw uploadError;
    }


    const {
        data: publicUrlData
    } =
        supabaseClient
            .storage
            .from("Fotos-Miembros")
            .getPublicUrl(
                nombreArchivo
            );


    return publicUrlData.publicUrl;
}


// ==========================================================
// 7. GUARDAR NUEVO MIEMBRO
// ==========================================================

if (memberForm) {

    memberForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            if (!supabaseDisponible()) {
                return;
            }


            const boton =
                memberForm.querySelector(
                    ".btn-guardar"
                );


            if (boton) {

                boton.disabled = true;

                boton.textContent =
                    "⏳ Guardando...";
            }


            try {

                const nombre =
                    document
                        .getElementById("nombre")
                        ?.value
                        .trim() || "";


                const telefono =
                    document
                        .getElementById("telefono")
                        ?.value
                        .trim() || "";


                const ministerio =
                    document
                        .getElementById("ministerio")
                        ?.value || "";


                const foto =
                    fotoInput
                        ? fotoInput.files[0]
                        : null;


                const diasSeleccionados = [];


                document
                    .querySelectorAll(
                        'input[name="dias"]:checked'
                    )
                    .forEach(
                        function (checkbox) {

                            diasSeleccionados.push(
                                checkbox.value
                            );

                        }
                    );


                if (!nombre) {

                    alert(
                        "Por favor, escriba el nombre del miembro."
                    );

                    return;
                }


                if (!ministerio) {

                    alert(
                        "Por favor, seleccione el ministerio."
                    );

                    return;
                }


                if (
                    diasSeleccionados.length === 0
                ) {

                    alert(
                        "Seleccione por lo menos un día de asistencia."
                    );

                    return;
                }


                // ------------------------------------------
                // FOTO
                // ------------------------------------------

                let fotoUrl = null;


                if (foto) {

                    fotoUrl =
                        await subirFoto(
                            foto,
                            "miembro"
                        );
                }


                // ------------------------------------------
                // DATOS
                // ------------------------------------------

                const nuevoMiembro = {

                    nombre: nombre,

                    telefono: telefono,

                    ministerio: ministerio,

                    foto_url: fotoUrl,

                    lunes:
                        diasSeleccionados.includes(
                            "lunes"
                        ),

                    martes:
                        diasSeleccionados.includes(
                            "martes"
                        ),

                    miercoles:
                        diasSeleccionados.includes(
                            "miercoles"
                        ),

                    jueves:
                        diasSeleccionados.includes(
                            "jueves"
                        ),

                    viernes:
                        diasSeleccionados.includes(
                            "viernes"
                        ),

                    sabado:
                        diasSeleccionados.includes(
                            "sabado"
                        ),

                    domingo:
                        diasSeleccionados.includes(
                            "domingo"
                        ),

                    activo: true
                };


                // ------------------------------------------
                // INSERTAR
                // ------------------------------------------

                const {
                    error
                } =
                    await supabaseClient
                        .from("miembros")
                        .insert(
                            nuevoMiembro
                        );


                if (error) {
                    throw error;
                }


                alert(
                    "✅ Miembro guardado correctamente."
                );


                memberForm.reset();


                if (preview) {

                    preview.src = "";

                    preview.style.display =
                        "none";
                }


                await cargarMiembros();


            } catch (error) {

                alert(
                    "❌ No se pudo guardar el miembro.\n\n" +
                    mostrarError(error)
                );


            } finally {

                if (boton) {

                    boton.disabled = false;

                    boton.textContent =
                        "💾 Guardar miembro";
                }
            }
        }
    );
}


// ==========================================================
// 8. CARGAR MIEMBROS
// ==========================================================

async function cargarMiembros() {

    if (!listaMiembros) {
        return;
    }

    if (!supabaseDisponible()) {
        return;
    }


    listaMiembros.innerHTML =
        '<p class="mensaje">⏳ Cargando miembros...</p>';


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("miembros")
                .select("*")
                .eq("activo", true)
                .order(
                    "nombre",
                    {
                        ascending: true
                    }
                );


        if (error) {
            throw error;
        }


        mostrarMiembros(
            data || []
        );


    } catch (error) {

        console.error(
            "Error cargando miembros:",
            error
        );


        listaMiembros.innerHTML =
            `
            <p class="mensaje">
                ❌ No se pudieron cargar los miembros.
                <br><br>
                ${escapeHTML(
                    mostrarError(error)
                )}
            </p>
            `;
    }
}


// ==========================================================
// 9. MOSTRAR MIEMBROS
// ==========================================================

function mostrarMiembros(
    miembros
) {

    if (!listaMiembros) {
        return;
    }


    if (
        !miembros ||
        miembros.length === 0
    ) {

        listaMiembros.innerHTML =
            `
            <p class="mensaje">
                Todavía no hay miembros registrados.
            </p>
            `;

        return;
    }


    listaMiembros.innerHTML = "";


    miembros.forEach(
        function (miembro) {

            const tarjeta =
                document.createElement(
                    "div"
                );

            tarjeta.className =
                "miembro-card";


            const dias =
                obtenerDias(
                    miembro
                );


            let fotoHTML;


            if (miembro.foto_url) {

                fotoHTML =
                    `
                    <img
                        src="${escapeHTML(
                            miembro.foto_url
                        )}"
                        alt="Foto de ${escapeHTML(
                            miembro.nombre
                        )}"
                        class="miembro-foto"
                    >
                    `;

            } else {

                fotoHTML =
                    `
                    <div class="miembro-foto foto-default">
                        👤
                    </div>
                    `;
            }


            tarjeta.innerHTML =
                `
                ${fotoHTML}

                <div class="miembro-info">

                    <h3>
                        ${escapeHTML(
                            miembro.nombre
                        )}
                    </h3>

                    <p>
                        ⛪
                        ${escapeHTML(
                            miembro.ministerio ||
                            "Sin ministerio"
                        )}
                    </p>

                    <p>
                        📞
                        ${escapeHTML(
                            miembro.telefono ||
                            "Sin teléfono"
                        )}
                    </p>

                    <p>
                        📅
                        ${escapeHTML(
                            dias ||
                            "Sin días registrados"
                        )}
                    </p>

                </div>

                <div class="miembro-acciones">

                    <button
                        type="button"
                        class="btn-editar"
                        data-id="${escapeHTML(
                            miembro.id
                        )}"
                    >
                        ✏️ Editar
                    </button>

                </div>
                `;


            const botonEditar =
                tarjeta.querySelector(
                    ".btn-editar"
                );


            if (botonEditar) {

                botonEditar.addEventListener(
                    "click",
                    function () {

                        abrirModalEditar(
                            miembro.id
                        );

                    }
                );
            }


            listaMiembros.appendChild(
                tarjeta
            );
        }
    );
}


// ==========================================================
// 10. BUSCAR MIEMBROS
// ==========================================================

if (buscar) {

    buscar.addEventListener(
        "input",
        async function () {

            if (!supabaseDisponible()) {
                return;
            }


            const texto =
                buscar.value.trim();


            if (!texto) {

                await cargarMiembros();

                return;
            }


            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .from("miembros")
                        .select("*")
                        .eq("activo", true)
                        .ilike(
                            "nombre",
                            `%${texto}%`
                        )
                        .order(
                            "nombre",
                            {
                                ascending: true
                            }
                        );


                if (error) {
                    throw error;
                }


                mostrarMiembros(
                    data || []
                );


            } catch (error) {

                console.error(
                    "Error buscando miembros:",
                    error
                );

                listaMiembros.innerHTML =
                    `
                    <p class="mensaje">
                        ❌ Error buscando miembros.
                        <br><br>
                        ${escapeHTML(
                            mostrarError(error)
                        )}
                    </p>
                    `;
            }
        }
    );
}


// ==========================================================
// 11. MODAL DE EDICIÓN
// ==========================================================

async function abrirModalEditar(id) {

    if (!modalEditar) {

        alert(
            "El formulario de edición no está incluido en index.html."
        );

        return;
    }


    if (!supabaseDisponible()) {
        return;
    }


    try {

        const {
            data: miembro,
            error
        } =
            await supabaseClient
                .from("miembros")
                .select("*")
                .eq("id", id)
                .single();


        if (error) {
            throw error;
        }


        if (!miembro) {

            alert(
                "No se encontró el miembro."
            );

            return;
        }


        if (editarId) {
            editarId.value =
                miembro.id;
        }


        if (editarNombre) {
            editarNombre.value =
                miembro.nombre || "";
        }


        if (editarTelefono) {
            editarTelefono.value =
                miembro.telefono || "";
        }


        if (editarMinisterio) {

            const ministerioOriginal =
                document.getElementById(
                    "ministerio"
                );


            if (ministerioOriginal) {

                editarMinisterio.innerHTML =
                    ministerioOriginal.innerHTML;
            }


            editarMinisterio.value =
                miembro.ministerio || "";
        }


        document
            .querySelectorAll(
                'input[name="editarDias"]'
            )
            .forEach(
                function (checkbox) {

                    checkbox.checked =
                        miembro[
                            checkbox.value
                        ] === true;
                }
            );


        if (editarFoto) {

            editarFoto.value = "";
        }


        if (editarPreview) {

            if (miembro.foto_url) {

                editarPreview.src =
                    miembro.foto_url;

                editarPreview.style.display =
                    "block";

            } else {

                editarPreview.src = "";

                editarPreview.style.display =
                    "none";
            }
        }


        modalEditar.classList.add(
            "mostrar"
        );

        document.body.classList.add(
            "modal-abierto"
        );


    } catch (error) {

        alert(
            "❌ No se pudo cargar el miembro.\n\n" +
            mostrarError(error)
        );
    }
}


// ==========================================================
// 12. CERRAR MODAL
// ==========================================================

function cerrarModalEditar() {

    if (!modalEditar) {
        return;
    }


    modalEditar.classList.remove(
        "mostrar"
    );


    document.body.classList.remove(
        "modal-abierto"
    );


    if (formEditarMiembro) {

        formEditarMiembro.reset();
    }


    if (editarPreview) {

        editarPreview.src = "";

        editarPreview.style.display =
            "none";
    }
}


if (btnCerrarModal) {

    btnCerrarModal.addEventListener(
        "click",
        cerrarModalEditar
    );
}


if (btnCancelarEdicion) {

    btnCancelarEdicion.addEventListener(
        "click",
        cerrarModalEditar
    );
}


if (modalEditar) {

    modalEditar.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                modalEditar
            ) {

                cerrarModalEditar();
            }
        }
    );
}


// ==========================================================
// 13. VISTA PREVIA DE FOTO AL EDITAR
// ==========================================================

if (
    editarFoto &&
    editarPreview
) {

    editarFoto.addEventListener(
        "change",
        function () {

            const archivo =
                editarFoto.files[0];


            if (!archivo) {
                return;
            }


            editarPreview.src =
                URL.createObjectURL(
                    archivo
                );


            editarPreview.style.display =
                "block";
        }
    );
}


// ==========================================================
// 14. GUARDAR EDICIÓN
// ==========================================================

if (formEditarMiembro) {

    formEditarMiembro.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!supabaseDisponible()) {
                return;
            }


            const id =
                editarId?.value || "";


            const nombre =
                editarNombre?.value.trim() ||
                "";


            const telefono =
                editarTelefono?.value.trim() ||
                "";


            const ministerio =
                editarMinisterio?.value ||
                "";


            const foto =
                editarFoto?.files[0] ||
                null;


            if (!id) {

                alert(
                    "No se encontró el ID del miembro."
                );

                return;
            }


            if (!nombre) {

                alert(
                    "Por favor, escriba el nombre."
                );

                return;
            }


            if (!ministerio) {

                alert(
                    "Por favor, seleccione el ministerio."
                );

                return;
            }


            const diasSeleccionados = [];


            document
                .querySelectorAll(
                    'input[name="editarDias"]:checked'
                )
                .forEach(
                    function (checkbox) {

                        diasSeleccionados.push(
                            checkbox.value
                        );
                    }
                );


            if (
                diasSeleccionados.length === 0
            ) {

                alert(
                    "Seleccione por lo menos un día."
                );

                return;
            }


            if (btnGuardarEdicion) {

                btnGuardarEdicion.disabled =
                    true;

                btnGuardarEdicion.textContent =
                    "⏳ Guardando...";
            }


            try {

                const datosActualizar = {

                    nombre: nombre,

                    telefono: telefono,

                    ministerio: ministerio,

                    lunes:
                        diasSeleccionados.includes(
                            "lunes"
                        ),

                    martes:
                        diasSeleccionados.includes(
                            "martes"
                        ),

                    miercoles:
                        diasSeleccionados.includes(
                            "miercoles"
                        ),

                    jueves:
                        diasSeleccionados.includes(
                            "jueves"
                        ),

                    viernes:
                        diasSeleccionados.includes(
                            "viernes"
                        ),

                    sabado:
                        diasSeleccionados.includes(
                            "sabado"
                        ),

                    domingo:
                        diasSeleccionados.includes(
                            "domingo"
                        )
                };


                if (foto) {

                    datosActualizar.foto_url =
                        await subirFoto(
                            foto,
                            "editar"
                        );
                }


                const {
                    error
                } =
                    await supabaseClient
                        .from("miembros")
                        .update(
                            datosActualizar
                        )
                        .eq("id", id);


                if (error) {
                    throw error;
                }


                alert(
                    "✅ Miembro actualizado correctamente."
                );


                cerrarModalEditar();


                await cargarMiembros();


                if (
                    fechaAsistencia &&
                    servicioAsistencia &&
                    fechaAsistencia.value &&
                    servicioAsistencia.value
                ) {

                    await cargarListaAsistencia();
                }


            } catch (error) {

                alert(
                    "❌ No se pudo actualizar el miembro.\n\n" +
                    mostrarError(error)
                );


            } finally {

                if (btnGuardarEdicion) {

                    btnGuardarEdicion.disabled =
                        false;

                    btnGuardarEdicion.textContent =
                        "💾 Guardar cambios";
                }
            }
        }
    );
}


// ==========================================================
// 15. FECHA DE ASISTENCIA
// ==========================================================

if (fechaAsistencia) {

    fechaAsistencia.value =
        fechaHoy();
}


// ==========================================================
// 16. CARGAR ASISTENCIA
// ==========================================================

if (btnCargarAsistencia) {

    btnCargarAsistencia.addEventListener(
        "click",
        cargarListaAsistencia
    );
}


async function cargarListaAsistencia() {

    if (
        !fechaAsistencia ||
        !servicioAsistencia ||
        !listaAsistencia
    ) {
        return;
    }


    if (!supabaseDisponible()) {
        return;
    }


    const fecha =
        fechaAsistencia.value;


    const servicio =
        servicioAsistencia.value;


    if (!fecha) {

        alert(
            "Seleccione la fecha."
        );

        return;
    }


    if (!servicio) {

        alert(
            "Seleccione el servicio o reunión."
        );

        return;
    }


    listaAsistencia.innerHTML =
        `
        <p class="mensaje">
            ⏳ Cargando miembros...
        </p>
        `;


    try {

        // ------------------------------------------
        // MIEMBROS
        // ------------------------------------------

        const {
            data: miembros,
            error: errorMiembros
        } =
            await supabaseClient
                .from("miembros")
                .select("*")
                .eq("activo", true)
                .order(
                    "nombre",
                    {
                        ascending: true
                    }
                );


        if (errorMiembros) {
            throw errorMiembros;
        }


        if (
            !miembros ||
            miembros.length === 0
        ) {

            listaAsistencia.innerHTML =
                `
                <p class="mensaje">
                    No hay miembros registrados.
                </p>
                `;

            return;
        }


        // ------------------------------------------
        // ASISTENCIAS EXISTENTES
        // ------------------------------------------

        const {
            data: asistencias,
            error: errorAsistencias
        } =
            await supabaseClient
                .from("asistencias")
                .select(
                    "miembro_id"
                )
                .eq(
                    "fecha",
                    fecha
                )
                .eq(
                    "servicio",
                    servicio
                );


        if (errorAsistencias) {
            throw errorAsistencias;
        }


        const idsAsistentes =
            new Set(
                (asistencias || [])
                    .map(
                        function (registro) {

                            return String(
                                registro.miembro_id
                            );
                        }
                    )
            );


        // ------------------------------------------
        // DÍA
        // ------------------------------------------

        const nombreDia =
            obtenerNombreDia(
                fecha
            );


        // ------------------------------------------
        // ORDENAR
        // PRIMERO LOS QUE NORMALMENTE ASISTEN
        // ------------------------------------------

        miembros.sort(
            function (a, b) {

                const aEsperado =
                    a[nombreDia]
                        ? 1
                        : 0;


                const bEsperado =
                    b[nombreDia]
                        ? 1
                        : 0;


                if (
                    aEsperado !==
                    bEsperado
                ) {

                    return (
                        bEsperado -
                        aEsperado
                    );
                }


                return (
                    a.nombre || ""
                ).localeCompare(
                    b.nombre || ""
                );
            }
        );


        // ------------------------------------------
        // MOSTRAR
        // ------------------------------------------

        listaAsistencia.innerHTML =
            "";


        miembros.forEach(
            function (miembro) {

                const asistio =
                    idsAsistentes.has(
                        String(miembro.id)
                    );


                const normalmenteViene =
                    miembro[
                        nombreDia
                    ] === true;


                const fila =
                    document.createElement(
                        "label"
                    );


                fila.className =
                    "asistencia-miembro";


                const fotoHTML =
                    miembro.foto_url

                        ? `
                        <img
                            src="${escapeHTML(
                                miembro.foto_url
                            )}"
                            class="asistencia-foto"
                            alt="Foto"
                        >
                        `

                        : `
                        <div
                            class="asistencia-foto"
                            style="
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                background:#e9eef3;
                                font-size:22px;
                            "
                        >
                            👤
                        </div>
                        `;


                fila.innerHTML =
                    `
                    <input
                        type="checkbox"
                        class="check-asistencia"
                        data-miembro-id="${escapeHTML(
                            miembro.id
                        )}"
                        ${
                            asistio
                                ? "checked"
                                : ""
                        }
                    >

                    ${fotoHTML}

                    <div class="asistencia-info">

                        <strong>
                            ${escapeHTML(
                                miembro.nombre
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                miembro.ministerio ||
                                "Sin ministerio"
                            )}
                        </small>

                        ${
                            normalmenteViene

                                ? `
                                <div class="asistira-label">
                                    ✓ Normalmente asiste este día
                                </div>
                                `

                                : ""
                        }

                    </div>
                    `;


                listaAsistencia.appendChild(
                    fila
                );
            }
        );


    } catch (error) {

        console.error(
            "Error cargando asistencia:",
            error
        );


        listaAsistencia.innerHTML =
            `
            <p class="mensaje">
                ❌ Error cargando la asistencia.
                <br><br>
                ${escapeHTML(
                    mostrarError(error)
                )}
            </p>
            `;
    }
}


// ==========================================================
// 17. GUARDAR ASISTENCIA
// ==========================================================

if (btnGuardarAsistencia) {

    btnGuardarAsistencia.addEventListener(
        "click",
        guardarAsistencia
    );
}


async function guardarAsistencia() {

    if (
        !fechaAsistencia ||
        !servicioAsistencia ||
        !listaAsistencia
    ) {
        return;
    }


    if (!supabaseDisponible()) {
        return;
    }


    const fecha =
        fechaAsistencia.value;


    const servicio =
        servicioAsistencia.value;


    if (!fecha) {

        alert(
            "Seleccione la fecha."
        );

        return;
    }


    if (!servicio) {

        alert(
            "Seleccione el servicio."
        );

        return;
    }


    const checkboxes =
        listaAsistencia.querySelectorAll(
            ".check-asistencia"
        );


    if (
        checkboxes.length === 0
    ) {

        alert(
            "Primero debe cargar los miembros."
        );

        return;
    }


    if (btnGuardarAsistencia) {

        btnGuardarAsistencia.disabled =
            true;

        btnGuardarAsistencia.textContent =
            "⏳ Guardando...";
    }


    try {

        // ------------------------------------------
        // ELIMINAR REGISTROS ANTERIORES
        // ------------------------------------------

        const {
            error: errorDelete
        } =
            await supabaseClient
                .from("asistencias")
                .delete()
                .eq(
                    "fecha",
                    fecha
                )
                .eq(
                    "servicio",
                    servicio
                );


        if (errorDelete) {
            throw errorDelete;
        }


        // ------------------------------------------
        // CREAR REGISTROS
        // ------------------------------------------

        const registros = [];


        checkboxes.forEach(
            function (checkbox) {

                if (
                    checkbox.checked
                ) {

                    registros.push({

                        miembro_id:
                            checkbox.dataset
                                .miembroId,

                        fecha:
                            fecha,

                        servicio:
                            servicio,

                        asistio:
                            true
                    });
                }
            }
        );


        // ------------------------------------------
        // INSERTAR
        // ------------------------------------------

        if (
            registros.length > 0
        ) {

            const {
                error: errorInsert
            } =
                await supabaseClient
                    .from("asistencias")
                    .insert(
                        registros
                    );


            if (errorInsert) {
                throw errorInsert;
            }
        }


        alert(
            "✅ Asistencia guardada correctamente.\n\n" +
            "Fecha: " +
            fecha +
            "\n" +
            "Servicio: " +
            servicio +
            "\n" +
            "Asistieron: " +
            registros.length
        );


        await cargarListaAsistencia();


    } catch (error) {

        console.error(
            "Error guardando asistencia:",
            error
        );


        alert(
            "❌ No se pudo guardar la asistencia.\n\n" +
            mostrarError(error)
        );


    } finally {

        if (btnGuardarAsistencia) {

            btnGuardarAsistencia.disabled =
                false;

            btnGuardarAsistencia.textContent =
                "💾 Guardar asistencia";
        }
    }
}


// ==========================================================
// 18. ESTADÍSTICAS
// ==========================================================

if (mesEstadistica) {

    mesEstadistica.value =
        String(
            new Date().getMonth() + 1
        );
}


if (anoEstadistica) {

    anoEstadistica.value =
        String(
            new Date().getFullYear()
        );
}


// ==========================================================
// 19. BOTÓN ESTADÍSTICAS
// ==========================================================

if (btnCargarEstadisticas) {

    btnCargarEstadisticas.addEventListener(
        "click",
        cargarEstadisticas
    );
}


async function cargarEstadisticas() {

    if (
        !mesEstadistica ||
        !anoEstadistica ||
        !resultadoEstadisticas
    ) {
        return;
    }


    if (!supabaseDisponible()) {
        return;
    }


    const mes =
        Number(
            mesEstadistica.value
        );


    const año =
        Number(
            anoEstadistica.value
        );


    if (!mes || !año) {

        alert(
            "Seleccione el mes y el año."
        );

        return;
    }


    const mesTexto =
        String(mes).padStart(
            2,
            "0"
        );


    const inicioMes =
        `${año}-${mesTexto}-01`;


    const ultimoDia =
        new Date(
            año,
            mes,
            0
        ).getDate();


    const finMes =
        `${año}-${mesTexto}-${String(
            ultimoDia
        ).padStart(2, "0")}`;


    resultadoEstadisticas.innerHTML =
        `
        <p class="mensaje">
            ⏳ Generando estadísticas...
        </p>
        `;


    try {

        // ------------------------------------------
        // MIEMBROS
        // ------------------------------------------

        const {
            data: miembros,
            error: errorMiembros
        } =
            await supabaseClient
                .from("miembros")
                .select("*")
                .eq(
                    "activo",
                    true
                )
                .order(
                    "nombre",
                    {
                        ascending: true
                    }
                );


        if (errorMiembros) {
            throw errorMiembros;
        }


        // ------------------------------------------
        // ASISTENCIAS
        // ------------------------------------------

        const {
            data: asistencias,
            error: errorAsistencias
        } =
            await supabaseClient
                .from("asistencias")
                .select(
                    "miembro_id, fecha, servicio, asistio"
                )
                .gte(
                    "fecha",
                    inicioMes
                )
                .lte(
                    "fecha",
                    finMes
                );


        if (errorAsistencias) {
            throw errorAsistencias;
        }


        // ------------------------------------------
        // REUNIONES
        // ------------------------------------------

        const reuniones =
            new Set();


        (asistencias || [])
            .forEach(
                function (registro) {

                    reuniones.add(
                        registro.fecha +
                        "|" +
                        registro.servicio
                    );
                }
            );


        // ------------------------------------------
        // CALCULAR
        // ------------------------------------------

        const resultados =
            (miembros || [])
                .map(
                    function (miembro) {

                        let esperadas = 0;

                        let asistenciasMiembro =
                            0;


                        reuniones.forEach(
                            function (reunion) {

                                const partes =
                                    reunion.split(
                                        "|"
                                    );


                                const fecha =
                                    partes[0];


                                const dia =
                                    obtenerNombreDia(
                                        fecha
                                    );


                                if (
                                    miembro[dia] ===
                                    true
                                ) {

                                    esperadas++;
                                }
                            }
                        );


                        (asistencias || [])
                            .forEach(
                                function (
                                    registro
                                ) {

                                    if (
                                        String(
                                            registro.miembro_id
                                        ) !==
                                        String(
                                            miembro.id
                                        )
                                    ) {

                                        return;
                                    }


                                    if (
                                        !registro.asistio
                                    ) {

                                        return;
                                    }


                                    const dia =
                                        obtenerNombreDia(
                                            registro.fecha
                                        );


                                    if (
                                        miembro[dia] ===
                                        true
                                    ) {

                                        asistenciasMiembro++;
                                    }
                                }
                            );


                        let porcentaje = 0;


                        if (
                            esperadas > 0
                        ) {

                            porcentaje =
                                Math.round(
                                    (
                                        asistenciasMiembro /
                                        esperadas
                                    ) * 100
                                );
                        }


                        if (
                            porcentaje > 100
                        ) {

                            porcentaje =
                                100;
                        }


                        return {

                            miembro:
                                miembro,

                            esperadas:
                                esperadas,

                            asistencias:
                                asistenciasMiembro,

                            porcentaje:
                                porcentaje
                        };
                    }
                );


        mostrarEstadisticas(
            resultados,
            reuniones.size
        );


    } catch (error) {

        console.error(
            "Error generando estadísticas:",
            error
        );


        resultadoEstadisticas.innerHTML =
            `
            <p class="mensaje">
                ❌ No se pudieron generar las estadísticas.
                <br><br>
                ${escapeHTML(
                    mostrarError(error)
                )}
            </p>
            `;
    }
}


// ==========================================================
// 20. MOSTRAR ESTADÍSTICAS
// ==========================================================

function mostrarEstadisticas(
    resultados,
    totalReuniones
) {

    if (!resultadoEstadisticas) {
        return;
    }


    if (
        !resultados ||
        resultados.length === 0
    ) {

        resultadoEstadisticas.innerHTML =
            `
            <p class="mensaje">
                No hay miembros registrados.
            </p>
            `;

        return;
    }


    const promedio =
        resultados.length > 0

            ? Math.round(
                resultados.reduce(
                    function (
                        total,
                        resultado
                    ) {

                        return (
                            total +
                            resultado.porcentaje
                        );
                    },
                    0
                ) /
                resultados.length
            )

            : 0;


    resultadoEstadisticas.innerHTML =
        `
        <div class="resumen-estadisticas">

            <div class="resumen-card">
                <strong>
                    ${resultados.length}
                </strong>
                <span>
                    Miembros activos
                </span>
            </div>

            <div class="resumen-card">
                <strong>
                    ${totalReuniones}
                </strong>
                <span>
                    Reuniones registradas
                </span>
            </div>

            <div class="resumen-card">
                <strong>
                    ${promedio}%
                </strong>
                <span>
                    Promedio de asistencia
                </span>
            </div>

        </div>
        `;


    const lista =
        document.createElement(
            "div"
        );


    lista.className =
        "lista-estadisticas";


    resultados.forEach(
        function (resultado) {

            const miembro =
                resultado.miembro;


            let estado =
                "Sin datos";


            if (
                resultado.porcentaje >=
                80
            ) {

                estado =
                    "Buena asistencia";

            } else if (
                resultado.porcentaje >=
                50
            ) {

                estado =
                    "Asistencia regular";

            } else if (
                resultado.esperadas > 0
            ) {

                estado =
                    "Baja asistencia";
            }


            const tarjeta =
                document.createElement(
                    "div"
                );


            tarjeta.className =
                "reporte-miembro";


            const fotoHTML =
                miembro.foto_url

                    ? `
                    <img
                        src="${escapeHTML(
                            miembro.foto_url
                        )}"
                        alt="Foto"
                        class="reporte-foto"
                    >
                    `

                    : `
                    <div
                        class="reporte-foto"
                        style="
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            background:#e9eef3;
                            font-size:25px;
                        "
                    >
                        👤
                    </div>
                    `;


            tarjeta.innerHTML =
                `
                ${fotoHTML}

                <div class="reporte-info">

                    <h3>
                        ${escapeHTML(
                            miembro.nombre
                        )}
                    </h3>

                    <p>
                        ⛪
                        ${escapeHTML(
                            miembro.ministerio ||
                            "Sin ministerio"
                        )}
                    </p>

                    <p>
                        📅
                        ${escapeHTML(
                            obtenerDias(
                                miembro
                            ) ||
                            "Sin días"
                        )}
                    </p>

                </div>

                <div class="reporte-estadistica">

                    <div class="reporte-porcentaje">
                        ${resultado.porcentaje}%
                    </div>

                    <div class="reporte-detalle">
                        ${resultado.asistencias}
                        de
                        ${resultado.esperadas}
                        reuniones esperadas
                    </div>

                    <span class="estado-asistencia">
                        ${estado}
                    </span>

                </div>
                `;


            lista.appendChild(
                tarjeta
            );
        }
    );


    resultadoEstadisticas.appendChild(
        lista
    );
}


// ==========================================================
// 21. COMPATIBILIDAD CON REPORTE ANTIGUO
// ==========================================================

if (mesReporte) {

    mesReporte.value =
        mesActual();
}


if (btnVerReporte) {

    btnVerReporte.addEventListener(
        "click",
        cargarReporteAntiguo
    );
}


async function cargarReporteAntiguo() {

    if (
        !mesReporte ||
        !resultadoReporte
    ) {
        return;
    }


    if (
        mesEstadistica &&
        anoEstadistica
    ) {

        const partes =
            mesReporte.value.split(
                "-"
            );


        if (
            partes.length === 2
        ) {

            anoEstadistica.value =
                partes[0];

            mesEstadistica.value =
                String(
                    Number(partes[1])
                );


            await cargarEstadisticas();

            return;
        }
    }
}


// ==========================================================
// 22. INICIAR APLICACIÓN
// ==========================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "🚀 Aplicación iniciada."
        );


        if (!supabaseClient) {
            return;
        }


        await cargarMiembros();


        if (
            fechaAsistencia &&
            !fechaAsistencia.value
        ) {

            fechaAsistencia.value =
                fechaHoy();
        }

    }
);
