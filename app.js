// ==========================================================
// CONTROL DE MIEMBROS Y ASISTENCIA
// app.js - VERSIÓN COMPLETA CORREGIDA
// PASOS 29 + 30 + 31
// ==========================================================


// ==========================================================
// CONEXIÓN CON SUPABASE
// ==========================================================

const SUPABASE_URL =
    "https://kjpwrpqlscitxyszsjkk.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_npgkf0Z40ecE7deKI7hHiw_ntgm0CJJ";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ==========================================================
// CONTROL DE INICIALIZACIÓN
// ==========================================================

let aplicacionInicializada = false;


// ==========================================================
// INICIAR APLICACIÓN
// ==========================================================

function iniciarAplicacion() {

    if (aplicacionInicializada) {
        return;
    }

    aplicacionInicializada = true;


    console.log(
        "✅ Aplicación iniciada correctamente."
    );


    inicializarMiembros();

    inicializarAsistencia();

    inicializarReporte();

    inicializarModalEditar();

}


// ==========================================================
// INICIALIZAR CUANDO EL HTML ESTÉ LISTO
// ==========================================================

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        iniciarAplicacion
    );

} else {

    iniciarAplicacion();

}


// ==========================================================
// ELEMENTOS - MIEMBROS
// ==========================================================

let memberForm;
let listaMiembros;
let buscar;
let fotoInput;
let preview;


// ==========================================================
// INICIALIZAR MIEMBROS
// ==========================================================

function inicializarMiembros() {

    memberForm =
        document.getElementById(
            "memberForm"
        );


    listaMiembros =
        document.getElementById(
            "listaMiembros"
        );


    buscar =
        document.getElementById(
            "buscar"
        );


    fotoInput =
        document.getElementById(
            "foto"
        );


    preview =
        document.getElementById(
            "preview"
        );


    // ------------------------------------------
    // VISTA PREVIA FOTO
    // ------------------------------------------

    if (fotoInput) {

        fotoInput.addEventListener(
            "change",
            mostrarVistaPreviaFoto
        );

    }


    // ------------------------------------------
    // GUARDAR MIEMBRO
    // ------------------------------------------

    if (memberForm) {

        memberForm.addEventListener(
            "submit",
            guardarMiembro
        );

    }


    // ------------------------------------------
    // BUSCAR
    // ------------------------------------------

    if (buscar) {

        buscar.addEventListener(
            "input",
            buscarMiembros
        );

    }


    cargarMiembros();

}


// ==========================================================
// VISTA PREVIA FOTO NUEVO MIEMBRO
// ==========================================================

function mostrarVistaPreviaFoto() {

    const archivo =
        fotoInput &&
        fotoInput.files
            ? fotoInput.files[0]
            : null;


    if (!archivo) {

        if (preview) {

            preview.src = "";

            preview.style.display =
                "none";

        }

        return;
    }


    const url =
        URL.createObjectURL(
            archivo
        );


    if (preview) {

        preview.src =
            url;

        preview.style.display =
            "inline-block";

    }

}


// ==========================================================
// GUARDAR MIEMBRO
// ==========================================================

async function guardarMiembro(event) {

    event.preventDefault();


    const boton =
        document.querySelector(
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
                .value
                .trim();


        const telefono =
            document
                .getElementById("telefono")
                .value
                .trim();


        const ministerio =
            document
                .getElementById("ministerio")
                .value;


        const foto =
            fotoInput &&
            fotoInput.files
                ? fotoInput.files[0]
                : null;


        // ------------------------------------------
        // DÍAS
        // ------------------------------------------

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


        // ------------------------------------------
        // VALIDACIONES
        // ------------------------------------------

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

            const extension =
                obtenerExtension(
                    foto.name
                );


            const nombreArchivo =
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .substring(2) +
                "." +
                extension;


            const subida =
                await supabaseClient
                    .storage
                    .from("Fotos-Miembros")
                    .upload(
                        nombreArchivo,
                        foto
                    );


            if (subida.error) {

                throw subida.error;

            }


            const publicUrl =
                supabaseClient
                    .storage
                    .from("Fotos-Miembros")
                    .getPublicUrl(
                        nombreArchivo
                    );


            fotoUrl =
                publicUrl
                    .data
                    .publicUrl;

        }


        // ------------------------------------------
        // DATOS
        // ------------------------------------------

        const datosMiembro = {

            nombre:
                nombre,

            telefono:
                telefono,

            ministerio:
                ministerio,

            foto_url:
                fotoUrl,

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

            activo:
                true

        };


        // ------------------------------------------
        // INSERTAR
        // ------------------------------------------

        const resultado =
            await supabaseClient
                .from("miembros")
                .insert(
                    datosMiembro
                );


        if (resultado.error) {

            throw resultado.error;

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

        console.error(
            "Error guardando miembro:",
            error
        );


        alert(
            "❌ No se pudo guardar el miembro.\n\n" +
            error.message
        );


    } finally {

        if (boton) {

            boton.disabled = false;

            boton.textContent =
                "💾 Guardar miembro";

        }

    }

}


// ==========================================================
// OBTENER EXTENSIÓN
// ==========================================================

function obtenerExtension(
    nombreArchivo
) {

    const partes =
        nombreArchivo.split(".");


    return (
        partes.length > 1
            ? partes.pop()
            : "jpg"
    )
        .toLowerCase();

}


// ==========================================================
// CARGAR MIEMBROS
// ==========================================================

async function cargarMiembros() {

    if (!listaMiembros) {
        return;
    }


    listaMiembros.innerHTML =
        '<p class="mensaje">⏳ Cargando miembros...</p>';


    try {

        const resultado =
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


        if (resultado.error) {

            throw resultado.error;

        }


        mostrarMiembros(
            resultado.data || []
        );


    } catch (error) {

        console.error(
            "Error cargando miembros:",
            error
        );


        listaMiembros.innerHTML =
            '<p class="mensaje">❌ No se pudieron cargar los miembros.</p>';

    }

}


// ==========================================================
// MOSTRAR MIEMBROS
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

        listaMiembros.innerHTML = `
            <p class="mensaje">
                Todavía no hay miembros registrados.
            </p>
        `;

        return;

    }


    listaMiembros.innerHTML =
        "";


    miembros.forEach(
        function (miembro) {

            const dias =
                obtenerDias(
                    miembro
                );


            const tarjeta =
                document.createElement(
                    "div"
                );


            tarjeta.className =
                "miembro-card";


            // --------------------------------------
            // FOTO
            // --------------------------------------

            let fotoHTML = "";


            if (miembro.foto_url) {

                fotoHTML = `
                    <img
                        src="${miembro.foto_url}"
                        alt="Foto de ${escaparHTML(miembro.nombre)}"
                        class="miembro-foto"
                    >
                `;

            } else {

                fotoHTML = `
                    <div class="miembro-foto foto-default">
                        👤
                    </div>
                `;

            }


            // --------------------------------------
            // TARJETA
            // --------------------------------------

            tarjeta.innerHTML = `

                ${fotoHTML}

                <div class="miembro-info">

                    <h3>
                        ${escaparHTML(
                            miembro.nombre
                        )}
                    </h3>

                    <p>
                        ⛪ ${escaparHTML(
                            miembro.ministerio ||
                            "Sin ministerio"
                        )}
                    </p>

                    <p>
                        📞 ${escaparHTML(
                            miembro.telefono ||
                            "Sin teléfono"
                        )}
                    </p>

                    <p>
                        📅 ${escaparHTML(
                            dias ||
                            "Sin días registrados"
                        )}
                    </p>

                </div>

                <div class="miembro-acciones">

                    <button
                        type="button"
                        class="btn-editar"
                        data-id="${miembro.id}"
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
// ESCAPAR HTML
// ==========================================================

function escaparHTML(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "";

    }


    return String(valor)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ==========================================================
// OBTENER DÍAS
// ==========================================================

function obtenerDias(
    miembro
) {

    const dias = [];


    if (miembro.lunes)
        dias.push("Lunes");


    if (miembro.martes)
        dias.push("Martes");


    if (miembro.miercoles)
        dias.push("Miércoles");


    if (miembro.jueves)
        dias.push("Jueves");


    if (miembro.viernes)
        dias.push("Viernes");


    if (miembro.sabado)
        dias.push("Sábado");


    if (miembro.domingo)
        dias.push("Domingo");


    return dias.join(
        ", "
    );

}


// ==========================================================
// BUSCAR MIEMBROS
// ==========================================================

async function buscarMiembros() {

    if (!buscar) {
        return;
    }


    const texto =
        buscar.value.trim();


    if (!texto) {

        await cargarMiembros();

        return;

    }


    try {

        const resultado =
            await supabaseClient
                .from("miembros")
                .select("*")
                .eq(
                    "activo",
                    true
                )
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


        if (resultado.error) {

            throw resultado.error;

        }


        mostrarMiembros(
            resultado.data || []
        );


    } catch (error) {

        console.error(
            "Error buscando miembros:",
            error
        );

    }

}


// ==========================================================
// MODAL EDITAR MIEMBRO
// ==========================================================

let modalEditar;
let btnCerrarModal;
let btnCancelarEdicion;
let btnGuardarEdicion;
let editarId;
let editarNombre;
let editarTelefono;
let editarMinisterio;
let editarFoto;
let editarPreview;
let formEditarMiembro;


// ==========================================================
// INICIALIZAR MODAL
// ==========================================================

function inicializarModalEditar() {

    modalEditar =
        document.getElementById(
            "modalEditar"
        );


    btnCerrarModal =
        document.getElementById(
            "btnCerrarModal"
        );


    btnCancelarEdicion =
        document.getElementById(
            "btnCancelarEdicion"
        );


    btnGuardarEdicion =
        document.getElementById(
            "btnGuardarEdicion"
        );


    editarId =
        document.getElementById(
            "editarId"
        );


    editarNombre =
        document.getElementById(
            "editarNombre"
        );


    editarTelefono =
        document.getElementById(
            "editarTelefono"
        );


    editarMinisterio =
        document.getElementById(
            "editarMinisterio"
        );


    editarFoto =
        document.getElementById(
            "editarFoto"
        );


    editarPreview =
        document.getElementById(
            "editarPreview"
        );


    formEditarMiembro =
        document.getElementById(
            "formEditarMiembro"
        );


    // ------------------------------------------
    // CERRAR
    // ------------------------------------------

    if (btnCerrarModal) {

        btnCerrarModal.addEventListener(
            "click",
            cerrarModalEditar
        );

    }


    // ------------------------------------------
    // CANCELAR
    // ------------------------------------------

    if (btnCancelarEdicion) {

        btnCancelarEdicion.addEventListener(
            "click",
            cerrarModalEditar
        );

    }


    // ------------------------------------------
    // FOTO
    // ------------------------------------------

    if (editarFoto) {

        editarFoto.addEventListener(
            "change",
            vistaPreviaFotoEditar
        );

    }


    // ------------------------------------------
    // FORMULARIO
    // ------------------------------------------

    if (formEditarMiembro) {

        formEditarMiembro.addEventListener(
            "submit",
            guardarCambiosMiembro
        );

    }


    // ------------------------------------------
    // CLIC AFUERA
    // ------------------------------------------

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

}


// ==========================================================
// ABRIR MODAL EDITAR
// ==========================================================

async function abrirModalEditar(
    id
) {

    try {

        const resultado =
            await supabaseClient
                .from("miembros")
                .select("*")
                .eq(
                    "id",
                    id
                )
                .single();


        if (resultado.error) {

            throw resultado.error;

        }


        const miembro =
            resultado.data;


        if (!miembro) {

            alert(
                "No se encontró el miembro."
            );

            return;

        }


        editarId.value =
            miembro.id;


        editarNombre.value =
            miembro.nombre || "";


        editarTelefono.value =
            miembro.telefono || "";


        // ------------------------------------------
        // MINISTERIO
        // ------------------------------------------

        const ministerioOriginal =
            document.getElementById(
                "ministerio"
            );


        if (
            ministerioOriginal &&
            editarMinisterio
        ) {

            editarMinisterio.innerHTML =
                ministerioOriginal.innerHTML;

        }


        editarMinisterio.value =
            miembro.ministerio || "";


        // ------------------------------------------
        // DÍAS
        // ------------------------------------------

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


        // ------------------------------------------
        // FOTO
        // ------------------------------------------

        editarFoto.value =
            "";


        if (miembro.foto_url) {

            editarPreview.src =
                miembro.foto_url;

            editarPreview.style.display =
                "block";

        } else {

            editarPreview.src =
                "";

            editarPreview.style.display =
                "none";

        }


        // ------------------------------------------
        // MOSTRAR
        // ------------------------------------------

        modalEditar.classList.add(
            "mostrar"
        );


        document.body.classList.add(
            "modal-abierto"
        );


    } catch (error) {

        console.error(
            "Error cargando miembro:",
            error
        );


        alert(
            "❌ No se pudo cargar el miembro.\n\n" +
            error.message
        );

    }

}


// ==========================================================
// CERRAR MODAL
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

        editarPreview.src =
            "";

        editarPreview.style.display =
            "none";

    }

}


// ==========================================================
// VISTA PREVIA FOTO EDITAR
// ==========================================================

function vistaPreviaFotoEditar() {

    const archivo =
        editarFoto &&
        editarFoto.files
            ? editarFoto.files[0]
            : null;


    if (!archivo) {
        return;
    }


    const url =
        URL.createObjectURL(
            archivo
        );


    editarPreview.src =
        url;


    editarPreview.style.display =
        "block";

}


// ==========================================================
// GUARDAR CAMBIOS MIEMBRO
// ==========================================================

async function guardarCambiosMiembro(
    event
) {

    event.preventDefault();


    const id =
        editarId.value;


    const nombre =
        editarNombre.value.trim();


    const telefono =
        editarTelefono.value.trim();


    const ministerio =
        editarMinisterio.value;


    const foto =
        editarFoto &&
        editarFoto.files
            ? editarFoto.files[0]
            : null;


    // ------------------------------------------
    // VALIDACIONES
    // ------------------------------------------

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


    if (!btnGuardarEdicion) {

        alert(
            "No se encontró el botón de guardar."
        );

        return;

    }


    btnGuardarEdicion.disabled =
        true;


    btnGuardarEdicion.textContent =
        "⏳ Guardando...";


    try {

        // --------------------------------------
        // DÍAS
        // --------------------------------------

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


        // --------------------------------------
        // DATOS
        // --------------------------------------

        const datosActualizar = {

            nombre:
                nombre,

            telefono:
                telefono,

            ministerio:
                ministerio,

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


        // --------------------------------------
        // FOTO NUEVA
        // --------------------------------------

        if (foto) {

            const extension =
                obtenerExtension(
                    foto.name
                );


            const nombreArchivo =
                "editar-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .substring(2) +
                "." +
                extension;


            const subida =
                await supabaseClient
                    .storage
                    .from("Fotos-Miembros")
                    .upload(
                        nombreArchivo,
                        foto
                    );


            if (subida.error) {

                throw subida.error;

            }


            const publicUrl =
                supabaseClient
                    .storage
                    .from("Fotos-Miembros")
                    .getPublicUrl(
                        nombreArchivo
                    );


            datosActualizar.foto_url =
                publicUrl
                    .data
                    .publicUrl;

        }


        // --------------------------------------
        // ACTUALIZAR
        // --------------------------------------

        const resultado =
            await supabaseClient
                .from("miembros")
                .update(
                    datosActualizar
                )
                .eq(
                    "id",
                    id
                );


        if (resultado.error) {

            throw resultado.error;

        }


        alert(
            "✅ Miembro actualizado correctamente."
        );


        cerrarModalEditar();


        await cargarMiembros();


        // --------------------------------------
        // ACTUALIZAR ASISTENCIA
        // --------------------------------------

        if (
            typeof cargarListaAsistencia ===
            "function"
        ) {

            if (
                fechaAsistencia &&
                servicioAsistencia &&
                fechaAsistencia.value &&
                servicioAsistencia.value
            ) {

                await cargarListaAsistencia();

            }

        }


    } catch (error) {

        console.error(
            "Error actualizando miembro:",
            error
        );


        alert(
            "❌ No se pudo actualizar el miembro.\n\n" +
            error.message
        );


    } finally {

        btnGuardarEdicion.disabled =
            false;


        btnGuardarEdicion.textContent =
            "💾 Guardar cambios";

    }

}


// ==========================================================
// ASISTENCIA
// ==========================================================

let fechaAsistencia;
let servicioAsistencia;
let btnCargarAsistencia;
let btnGuardarAsistencia;
let listaAsistencia;


// ==========================================================
// INICIALIZAR ASISTENCIA
// ==========================================================

function inicializarAsistencia() {

    fechaAsistencia =
        document.getElementById(
            "fechaAsistencia"
        );


    servicioAsistencia =
        document.getElementById(
            "servicioAsistencia"
        );


    btnCargarAsistencia =
        document.getElementById(
            "btnCargarAsistencia"
        );


    btnGuardarAsistencia =
        document.getElementById(
            "btnGuardarAsistencia"
        );


    listaAsistencia =
        document.getElementById(
            "listaAsistencia"
        );


    // ------------------------------------------
    // FECHA DE HOY
    // ------------------------------------------

    if (fechaAsistencia) {

        fechaAsistencia.value =
            fechaHoy();

    }


    // ------------------------------------------
    // BOTÓN CARGAR
    // ------------------------------------------

    if (btnCargarAsistencia) {

        btnCargarAsistencia.addEventListener(
            "click",
            cargarListaAsistencia
        );

    }


    // ------------------------------------------
    // BOTÓN GUARDAR
    // ------------------------------------------

    if (btnGuardarAsistencia) {

        btnGuardarAsistencia.addEventListener(
            "click",
            guardarAsistencia
        );

    }

}


// ==========================================================
// FECHA HOY
// ==========================================================

function fechaHoy() {

    const ahora =
        new Date();


    const año =
        ahora.getFullYear();


    const mes =
        String(
            ahora.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const dia =
        String(
            ahora.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        año +
        "-" +
        mes +
        "-" +
        dia
    );

}


// ==========================================================
// OBTENER DÍA DE FECHA
// ==========================================================

function obtenerDiaDeFecha(
    fecha
) {

    const fechaObjeto =
        new Date(
            fecha +
            "T12:00:00"
        );


    const dias = [

        "domingo",

        "lunes",

        "martes",

        "miercoles",

        "jueves",

        "viernes",

        "sabado"

    ];


    return dias[
        fechaObjeto.getDay()
    ];

}


// ==========================================================
// OBTENER DÍA DEL SERVICIO
// ==========================================================

function obtenerDiaDelServicio() {

    if (!servicioAsistencia) {
        return "";
    }


    const opcion =
        servicioAsistencia.options[
            servicioAsistencia.selectedIndex
        ];


    if (!opcion) {
        return "";
    }


    const texto =
        (
            opcion.textContent ||
            ""
        )
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        );


    const valor =
        (
            opcion.value ||
            ""
        )
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        );


    const textoCompleto =
        texto +
        " " +
        valor;


    const dias = [

        "domingo",

        "lunes",

        "martes",

        "miercoles",

        "jueves",

        "viernes",

        "sabado"

    ];


    for (
        const dia of dias
    ) {

        if (
            textoCompleto.includes(
                dia
            )
        ) {

            return dia;

        }

    }


    return "";

}


// ==========================================================
// VALIDAR FECHA + SERVICIO
// ==========================================================

function validarFechaServicio() {

    if (
        !fechaAsistencia ||
        !servicioAsistencia
    ) {

        return true;

    }


    const fecha =
        fechaAsistencia.value;


    const servicio =
        servicioAsistencia.value;


    if (
        !fecha ||
        !servicio
    ) {

        return true;

    }


    const diaFecha =
        obtenerDiaDeFecha(
            fecha
        );


    const diaServicio =
        obtenerDiaDelServicio();


    console.log(
        "VALIDACIÓN FECHA/SERVICIO:",
        {
            fecha:
                fecha,

            diaFecha:
                diaFecha,

            servicio:
                servicio,

            diaServicio:
                diaServicio

        }
    );


    if (!diaServicio) {

        return true;

    }


    if (
        diaFecha !==
        diaServicio
    ) {

        const diaFechaTexto =
            diaFecha
                .charAt(0)
                .toUpperCase() +
            diaFecha.slice(1);


        const diaServicioTexto =
            diaServicio
                .charAt(0)
                .toUpperCase() +
            diaServicio.slice(1);


        alert(

            "⚠️ FECHA Y SERVICIO NO COINCIDEN\n\n" +

            "📅 La fecha " +
            fecha +
            " corresponde a: " +
            diaFechaTexto +

            "\n\n" +

            "🏛️ El servicio seleccionado corresponde a: " +
            diaServicioTexto +

            "\n\n" +

            "Seleccione la fecha o el servicio correcto."

        );


        return false;

    }


    return true;

}


// ==========================================================
// CARGAR LISTA DE ASISTENCIA
// ==========================================================

async function cargarListaAsistencia() {

    if (
        !fechaAsistencia ||
        !servicioAsistencia ||
        !listaAsistencia
    ) {

        return;

    }


    const fecha =
        fechaAsistencia.value;


    const servicio =
        servicioAsistencia.value;


    // ------------------------------------------
    // VALIDACIÓN
    // ------------------------------------------

    if (!fecha) {

        alert(
            "Seleccione la fecha de la asistencia."
        );

        return;

    }


    if (!servicio) {

        alert(
            "Seleccione el servicio o reunión."
        );

        return;

    }


    if (
        !validarFechaServicio()
    ) {

        return;

    }


    listaAsistencia.innerHTML =
        '<p class="mensaje">⏳ Cargando miembros...</p>';


    try {

        // --------------------------------------
        // MIEMBROS
        // --------------------------------------

        const resultadoMiembros =
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


        if (
            resultadoMiembros.error
        ) {

            throw resultadoMiembros.error;

        }


        const miembros =
            resultadoMiembros.data || [];


        if (
            miembros.length === 0
        ) {

            listaAsistencia.innerHTML =
                '<p class="sin-miembros">No hay miembros registrados.</p>';

            return;

        }


        // --------------------------------------
        // ASISTENCIAS EXISTENTES
        // --------------------------------------

        const resultadoAsistencias =
            await supabaseClient
                .from("asistencias")
                .select(
                    "miembro_id, fecha, servicio, asistio"
                )
                .eq(
                    "fecha",
                    fecha
                )
                .eq(
                    "servicio",
                    servicio
                );


        if (
            resultadoAsistencias.error
        ) {

            throw resultadoAsistencias.error;

        }


        const asistenciasExistentes =
            resultadoAsistencias.data || [];


        const idsAsistentes =
            new Set(
                asistenciasExistentes
                    .filter(
                        function (registro) {

                            return (
                                registro.asistio === true
                            );

                        }
                    )
                    .map(
                        function (registro) {

                            return Number(
                                registro.miembro_id
                            );

                        }
                    )
            );


        // --------------------------------------
        // DÍA
        // --------------------------------------

        const nombreDia =
            obtenerDiaDeFecha(
                fecha
            );


        // --------------------------------------
        // ORDENAR
        // --------------------------------------

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


                return a.nombre.localeCompare(
                    b.nombre
                );

            }
        );


        // --------------------------------------
        // MOSTRAR
        // --------------------------------------

        listaAsistencia.innerHTML =
            "";


        miembros.forEach(
            function (miembro) {

                const asistio =
                    idsAsistentes.has(
                        Number(
                            miembro.id
                        )
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


                let fotoHTML = "";


                if (
                    miembro.foto_url
                ) {

                    fotoHTML = `
                        <img
                            src="${miembro.foto_url}"
                            class="asistencia-foto"
                            alt="Foto"
                        >
                    `;

                } else {

                    fotoHTML = `
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

                }


                fila.innerHTML = `

                    <input
                        type="checkbox"
                        class="check-asistencia"
                        data-miembro-id="${miembro.id}"
                        ${
                            asistio
                                ? "checked"
                                : ""
                        }
                    >

                    ${fotoHTML}

                    <div class="asistencia-info">

                        <strong>
                            ${escaparHTML(
                                miembro.nombre
                            )}
                        </strong>

                        <small>
                            ${escaparHTML(
                                miembro.ministerio ||
                                "Sin ministerio"
                            )}
                        </small>

                        ${
                            normalmenteViene
                                ?
                                `
                                <div class="asistira-label">
                                    ✓ Normalmente asiste este día
                                </div>
                                `
                                :
                                ""
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

                ${escaparHTML(
                    error.message
                )}

            </p>
            `;

    }

}


// ==========================================================
// GUARDAR ASISTENCIA
// PASO 31 - VERSIÓN CORREGIDA
// ==========================================================

async function guardarAsistencia() {

    if (
        !fechaAsistencia ||
        !servicioAsistencia ||
        !btnGuardarAsistencia
    ) {

        return;

    }


    const fecha =
        fechaAsistencia.value;


    const servicio =
        servicioAsistencia.value;


    // ------------------------------------------
    // VALIDACIONES
    // ------------------------------------------

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


    if (
        !validarFechaServicio()
    ) {

        return;

    }


    // ------------------------------------------
    // CHECKBOXES
    // ------------------------------------------

    const checkboxes =
        document.querySelectorAll(
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


    // ------------------------------------------
    // BOTÓN
    // ------------------------------------------

    btnGuardarAsistencia.disabled =
        true;


    btnGuardarAsistencia.textContent =
        "⏳ Guardando...";


    try {

        // --------------------------------------
        // CREAR REGISTROS
        // --------------------------------------

        const registros = [];


        checkboxes.forEach(
            function (checkbox) {

                const miembroId =
                    Number(
                        checkbox.dataset.miembroId
                    );


                registros.push({

                    miembro_id:
                        miembroId,

                    fecha:
                        fecha,

                    servicio:
                        servicio,

                    asistio:
                        checkbox.checked

                });

            }
        );


        // --------------------------------------
        // VERIFICAR
        // --------------------------------------

        if (
            registros.length === 0
        ) {

            alert(
                "No hay miembros para guardar."
            );

            return;

        }


        console.log(
            "Guardando asistencia:",
            registros
        );


        // --------------------------------------
        // UPSERT
        // --------------------------------------
        //
        // La combinación:
        //
        // miembro_id
        // fecha
        // servicio
        //
        // es única en Supabase.
        //
        // Si existe:
        //     actualiza
        //
        // Si no existe:
        //     crea
        // --------------------------------------

        const resultado =
            await supabaseClient
                .from("asistencias")
                .upsert(
                    registros,
                    {
                        onConflict:
                            "miembro_id,fecha,servicio"
                    }
                );


        if (
            resultado.error
        ) {

            throw resultado.error;

        }


        // --------------------------------------
        // CONTAR ASISTENTES
        // --------------------------------------

        const cantidadAsistentes =
            registros.filter(
                function (registro) {

                    return (
                        registro.asistio === true
                    );

                }
            ).length;


        const cantidadAusentes =
            registros.length -
            cantidadAsistentes;


        // --------------------------------------
        // MENSAJE
        // --------------------------------------

        alert(

            "✅ Asistencia guardada correctamente.\n\n" +

            "📅 Fecha: " +
            fecha +

            "\n" +

            "🏛️ Servicio: " +
            servicio +

            "\n\n" +

            "👥 Miembros registrados: " +
            registros.length +

            "\n" +

            "✅ Asistieron: " +
            cantidadAsistentes +

            "\n" +

            "❌ No asistieron: " +
            cantidadAusentes

        );


        // --------------------------------------
        // RECARGAR LISTA
        // --------------------------------------

        await cargarListaAsistencia();


        // --------------------------------------
        // ACTUALIZAR REPORTE
        // --------------------------------------

        if (
            mesReporte &&
            mesReporte.value
        ) {

            await cargarReporte();

        }


    } catch (error) {

        console.error(
            "Error guardando asistencia:",
            error
        );


        alert(

            "❌ No se pudo guardar la asistencia.\n\n" +

            error.message

        );


    } finally {

        btnGuardarAsistencia.disabled =
            false;


        btnGuardarAsistencia.textContent =
            "💾 Guardar asistencia";

    }

}


// ==========================================================
// REPORTE MENSUAL
// ==========================================================

let mesReporte;
let btnVerReporte;
let resultadoReporte;
let resumenReporte;


// ==========================================================
// INICIALIZAR REPORTE
// ==========================================================

function inicializarReporte() {

    mesReporte =
        document.getElementById(
            "mesReporte"
        );


    btnVerReporte =
        document.getElementById(
            "btnVerReporte"
        );


    resultadoReporte =
        document.getElementById(
            "resultadoReporte"
        );


    resumenReporte =
        document.getElementById(
            "resumenReporte"
        );


    // ------------------------------------------
    // MES ACTUAL
    // ------------------------------------------

    if (mesReporte) {

        mesReporte.value =
            mesActual();

    }


    // ------------------------------------------
    // BOTÓN
    // ------------------------------------------

    if (btnVerReporte) {

        btnVerReporte.addEventListener(
            "click",
            cargarReporte
        );

    }


    console.log(
        "✅ Reporte inicializado correctamente."
    );

}


// ==========================================================
// MES ACTUAL
// ==========================================================

function mesActual() {

    const ahora =
        new Date();


    const año =
        ahora.getFullYear();


    const mes =
        String(
            ahora.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    return (
        año +
        "-" +
        mes
    );

}


// ==========================================================
// PASO 29
// CARGAR REPORTE MENSUAL CORREGIDO
// ==========================================================

async function cargarReporte() {

    if (
        !mesReporte ||
        !resultadoReporte ||
        !resumenReporte
    ) {

        console.error(
            "❌ Elementos del reporte no encontrados."
        );

        return;

    }


    const mes =
        mesReporte.value;


    if (!mes) {

        alert(
            "Seleccione un mes."
        );

        return;

    }


    if (btnVerReporte) {

        btnVerReporte.disabled =
            true;


        btnVerReporte.textContent =
            "⏳ Cargando...";

    }


    resultadoReporte.innerHTML =
        '<p class="mensaje">⏳ Generando reporte...</p>';


    resumenReporte.innerHTML =
        "";


    try {

        // ==================================================
        // 1. CALCULAR RANGO DEL MES
        // ==================================================

        const partesMes =
            mes.split("-");


        const año =
            Number(
                partesMes[0]
            );


        const numeroMes =
            Number(
                partesMes[1]
            );


        const inicioMes =
            mes +
            "-01";


        const ultimoDia =
            new Date(
                año,
                numeroMes,
                0
            ).getDate();


        const finMes =
            mes +
            "-" +
            String(
                ultimoDia
            ).padStart(
                2,
                "0"
            );


        console.log(
            "PASO 29 - Rango:",
            {
                mes:
                    mes,

                inicio:
                    inicioMes,

                fin:
                    finMes
            }
        );


        // ==================================================
        // 2. MIEMBROS ACTIVOS
        // ==================================================

        const resultadoMiembros =
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


        if (
            resultadoMiembros.error
        ) {

            throw resultadoMiembros.error;

        }


        const miembros =
            resultadoMiembros.data || [];


        // ==================================================
        // 3. ASISTENCIAS DEL MES
        // ==================================================

        const resultadoAsistencias =
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
                )
                .order(
                    "fecha",
                    {
                        ascending: true
                    }
                );


        if (
            resultadoAsistencias.error
        ) {

            throw resultadoAsistencias.error;

        }


        const asistencias =
            resultadoAsistencias.data || [];


        // ==================================================
        // 4. REUNIONES ÚNICAS
        //
        // Una reunión existe aunque todos tengan FALSE.
        // ==================================================

        const reunionesMap =
            new Map();


        asistencias.forEach(
            function (registro) {

                if (
                    !registro.fecha ||
                    !registro.servicio
                ) {

                    return;

                }


                const clave =
                    registro.fecha +
                    "|" +
                    registro.servicio;


                if (
                    !reunionesMap.has(
                        clave
                    )
                ) {

                    reunionesMap.set(
                        clave,
                        {

                            fecha:
                                registro.fecha,

                            servicio:
                                registro.servicio

                        }
                    );

                }

            }
        );


        const reuniones =
            Array.from(
                reunionesMap.values()
            );


        const totalReuniones =
            reuniones.length;


        // ==================================================
        // 5. ASISTENCIAS REALES
        // ==================================================

        const asistenciasReales =
            new Set();


        asistencias.forEach(
            function (registro) {

                if (
                    registro.asistio !== true
                ) {

                    return;

                }


                const clave =
                    Number(
                        registro.miembro_id
                    ) +
                    "|" +
                    registro.fecha +
                    "|" +
                    registro.servicio;


                asistenciasReales.add(
                    clave
                );

            }
        );


        // ==================================================
        // 6. RESULTADO DE CADA MIEMBRO
        // ==================================================

        const resultados =
            miembros.map(
                function (miembro) {

                    let reunionesEsperadas =
                        0;


                    let reunionesAsistidas =
                        0;


                    let reunionesAusentes =
                        0;


                    // --------------------------------------
                    // RECORRER REUNIONES
                    // --------------------------------------

                    reuniones.forEach(
                        function (reunion) {

                            const dia =
                                obtenerDiaDeFecha(
                                    reunion.fecha
                                );


                            // ----------------------------------
                            // ¿DEBÍA ASISTIR?
                            // ----------------------------------

                            const esperaba =
                                miembro[dia] === true;


                            if (!esperaba) {

                                return;

                            }


                            reunionesEsperadas++;


                            // ----------------------------------
                            // ¿ASISTIÓ?
                            // ----------------------------------

                            const clave =
                                Number(
                                    miembro.id
                                ) +
                                "|" +
                                reunion.fecha +
                                "|" +
                                reunion.servicio;


                            if (
                                asistenciasReales.has(
                                    clave
                                )
                            ) {

                                reunionesAsistidas++;

                            } else {

                                reunionesAusentes++;

                            }

                        }
                    );


                    // --------------------------------------
                    // PORCENTAJE
                    // --------------------------------------

                    let porcentaje =
                        0;


                    if (
                        reunionesEsperadas > 0
                    ) {

                        porcentaje =
                            Math.round(
                                (
                                    reunionesAsistidas /
                                    reunionesEsperadas
                                ) *
                                100
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
                            reunionesEsperadas,

                        asistencias:
                            reunionesAsistidas,

                        ausencias:
                            reunionesAusentes,

                        porcentaje:
                            porcentaje

                    };

                }
            );


        // ==================================================
        // 7. PROMEDIO GENERAL
        // ==================================================

        const totalMiembros =
            miembros.length;


        const sumaPorcentajes =
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
            );


        const promedio =
            totalMiembros > 0
                ?
                Math.round(
                    sumaPorcentajes /
                    totalMiembros
                )
                :
                0;


        // ==================================================
        // 8. RESUMEN
        // ==================================================

        resumenReporte.innerHTML = `

            <div class="resumen-card">

                <span class="numero">
                    ${totalMiembros}
                </span>

                <span class="texto">
                    Miembros activos
                </span>

            </div>


            <div class="resumen-card">

                <span class="numero">
                    ${totalReuniones}
                </span>

                <span class="texto">
                    Reuniones registradas
                </span>

            </div>


            <div class="resumen-card">

                <span class="numero">
                    ${promedio}%
                </span>

                <span class="texto">
                    Promedio de asistencia
                </span>

            </div>

        `;


        // ==================================================
        // 9. SIN MIEMBROS
        // ==================================================

        if (
            resultados.length === 0
        ) {

            resultadoReporte.innerHTML = `

                <p class="mensaje">

                    No hay miembros registrados.

                </p>

            `;

            return;

        }


        // ==================================================
        // 10. MOSTRAR RESULTADOS
        // ==================================================

        resultadoReporte.innerHTML =
            "";


        resultados.forEach(
            function (resultado) {

                const miembro =
                    resultado.miembro;


                const porcentaje =
                    resultado.porcentaje;


                // ------------------------------------------
                // ESTADO
                // ------------------------------------------

                let clasePorcentaje =
                    "porcentaje-sin-datos";


                let claseEstado =
                    "estado-sin-datos";


                let textoEstado =
                    "Sin datos";


                if (
                    resultado.esperadas === 0
                ) {

                    textoEstado =
                        "Sin reuniones esperadas";


                } else if (
                    porcentaje >= 80
                ) {

                    clasePorcentaje =
                        "porcentaje-alto";


                    claseEstado =
                        "estado-alto";


                    textoEstado =
                        "Buena asistencia";


                } else if (
                    porcentaje >= 50
                ) {

                    clasePorcentaje =
                        "porcentaje-medio";


                    claseEstado =
                        "estado-medio";


                    textoEstado =
                        "Asistencia regular";


                } else {

                    clasePorcentaje =
                        "porcentaje-bajo";


                    claseEstado =
                        "estado-bajo";


                    textoEstado =
                        "Baja asistencia";

                }


                // ------------------------------------------
                // TARJETA
                // ------------------------------------------

                const tarjeta =
                    document.createElement(
                        "div"
                    );


                tarjeta.className =
                    "reporte-miembro";


                // ------------------------------------------
                // FOTO
                // ------------------------------------------

                if (
                    miembro.foto_url
                ) {

                    tarjeta.innerHTML = `

                        <img
                            src="${miembro.foto_url}"
                            alt="Foto de ${escaparHTML(
                                miembro.nombre
                            )}"
                            class="reporte-foto"
                        >

                    `;

                } else {

                    tarjeta.innerHTML = `

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

                }


                // ------------------------------------------
                // INFORMACIÓN
                // ------------------------------------------

                tarjeta.innerHTML += `

                    <div class="reporte-info">

                        <h3>
                            ${escaparHTML(
                                miembro.nombre
                            )}
                        </h3>


                        <p>
                            ⛪
                            ${escaparHTML(
                                miembro.ministerio ||
                                "Sin ministerio"
                            )}
                        </p>


                        <p>
                            📅
                            ${escaparHTML(
                                obtenerDias(
                                    miembro
                                ) ||
                                "Sin días registrados"
                            )}
                        </p>

                    </div>


                    <div class="reporte-estadistica">

                        <div
                            class="reporte-porcentaje ${clasePorcentaje}"
                        >
                            ${porcentaje}%
                        </div>


                        <div class="reporte-detalle">

                            ${resultado.asistencias}

                            de

                            ${resultado.esperadas}

                            reuniones esperadas

                        </div>


                        <div class="reporte-detalle">

                            ${resultado.ausencias}

                            ausencia${
                                resultado.ausencias === 1
                                    ? ""
                                    : "s"
                            }

                        </div>


                        <span
                            class="estado-asistencia ${claseEstado}"
                        >
                            ${textoEstado}
                        </span>

                    </div>

                `;


                resultadoReporte.appendChild(
                    tarjeta
                );

            }
        );


        // ==================================================
        // 11. CONSOLA
        // ==================================================

        console.log(
            "PASO 29 - REPORTE GENERADO:",
            {

                miembros:
                    totalMiembros,

                reuniones:
                    totalReuniones,

                promedio:
                    promedio,

                resultados:
                    resultados

            }
        );


    } catch (error) {

        console.error(
            "Error generando reporte:",
            error
        );


        resultadoReporte.innerHTML = `

            <p class="mensaje">

                ❌ No se pudo generar el reporte.

                <br><br>

                ${escaparHTML(
                    error.message
                )}

            </p>

        `;


    } finally {

        if (btnVerReporte) {

            btnVerReporte.disabled =
                false;


            btnVerReporte.textContent =
                "📊 Ver reporte";

        }

    }

}


// ==========================================================
// FIN DE app.js
// ==========================================================