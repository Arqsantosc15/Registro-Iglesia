// ==========================================================
// CONTROL DE MIEMBROS Y ASISTENCIA
// app.js - VERSIÓN COMPLETA, CORREGIDA Y ORDENADA
// ==========================================================

// ==========================================================
// CONEXIÓN CON SUPABASE
// ==========================================================

const SUPABASE_URL = "https://kjpwrpqlscitxyszsjkk.supabase.co";
const SUPABASE_KEY = "sb_publishable_npgkf0Z40ecE7deKI7hHiw_ntgm0CJJ";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// ==========================================================
// AUTENTICACIÓN Y ROLES
// ==========================================================

let usuarioActual = null;
let rolUsuarioActual = null;
let ministerioUsuarioActual = null;
let miembroIdUsuarioActual = null;
let perfilUsuarioActual = null;
let aplicacionIniciada = false;
let miembrosPermitidosActuales = [];

// Elementos de login
let pantallaLogin;
let formLogin;
let loginEmail;
let loginPassword;
let btnLogin;
let mensajeLogin;
let usuarioConectado;
let nombreUsuario;
let rolUsuario;
let btnCerrarSesion;

// ==========================================================
// SERVICIOS / REUNIONES SEGÚN EL DÍA
// ==========================================================

const SERVICIOS_POR_DIA = {
    0: [{ value: "Culto Dominical", label: "Culto Dominical" }],
    1: [],
    2: [{ value: "Reunión", label: "Reunión" }],
    3: [{ value: "Oración de Jóvenes - Casa de Amigos", label: "Oración de Jóvenes - Casa de Amigos" }],
    4: [{ value: "Escuela Bíblica", label: "Escuela Bíblica" }],
    5: [{ value: "Reunión", label: "Reunión" }],
    6: [{ value: "Culto de Adolescentes", label: "Culto de Adolescentes" }]
};

// ==========================================================
// VARIABLES GENERALES
// ==========================================================

// Miembros
let memberForm;
let listaMiembros;
let buscar;
let fotoInput;
let preview;

// Modal editar
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

// Asistencia
let fechaAsistencia;
let servicioAsistencia;
let btnCargarAsistencia;
let btnGuardarAsistencia;
let listaAsistencia;

// Reporte
let tipoReporte;
let fechaReporte;
let mesReporte;
let anioReporte;
let btnVerReporte;
let resultadoReporte;
let resumenReporte;

// ==========================================================
// AUTENTICACIÓN
// ==========================================================

async function inicializarAutenticacion() {
    console.log("🔐 Iniciando sistema de autenticación...");

    pantallaLogin = document.getElementById("pantallaLogin");
    formLogin = document.getElementById("formLogin");
    loginEmail = document.getElementById("loginEmail");
    loginPassword = document.getElementById("loginPassword");
    btnLogin = document.getElementById("btnLogin");
    mensajeLogin = document.getElementById("mensajeLogin");
    usuarioConectado = document.getElementById("usuarioConectado");
    nombreUsuario = document.getElementById("nombreUsuario");
    rolUsuario = document.getElementById("rolUsuario");
    btnCerrarSesion = document.getElementById("btnCerrarSesion");

    if (formLogin) {
        formLogin.addEventListener("submit", iniciarSesion);
    }

    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", cerrarSesion);
    }

    const resultado = await supabaseClient.auth.getSession();

    if (resultado.error) {
        console.error("Error comprobando sesión:", resultado.error);
        mostrarLogin();
        return;
    }

    const session = resultado.data.session;

    if (session && session.user) {
        await cargarPerfilUsuario(session.user);
    } else {
        mostrarLogin();
    }

    supabaseClient.auth.onAuthStateChange((evento, sessionActual) => {
        console.log("🔐 Cambio de autenticación:", evento);

        if (evento === "SIGNED_OUT") {
            usuarioActual = null;
            rolUsuarioActual = null;
            ministerioUsuarioActual = null;
            miembroIdUsuarioActual = null;
            perfilUsuarioActual = null;
            miembrosPermitidosActuales = [];
            aplicacionIniciada = false;
            mostrarLogin();
            return;
        }

        if (
            (evento === "SIGNED_IN" || evento === "INITIAL_SESSION") &&
            sessionActual &&
            sessionActual.user
        ) {
            usuarioActual = sessionActual.user;
        }
    });
}

async function iniciarSesion(event) {
    event.preventDefault();

    const email = loginEmail ? loginEmail.value.trim() : "";
    const password = loginPassword ? loginPassword.value : "";

    if (!email || !password) {
        mostrarMensajeLogin("Por favor, introduzca el correo y la contraseña.");
        return;
    }

    if (btnLogin) {
        btnLogin.disabled = true;
        btnLogin.textContent = "⏳ Iniciando sesión...";
    }

    mostrarMensajeLogin("");

    try {
        const resultado = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (resultado.error) {
            throw resultado.error;
        }

        console.log("✅ Inicio de sesión correcto:", resultado.data.user);

        await cargarPerfilUsuario(resultado.data.user);
    } catch (error) {
        console.error("Error iniciando sesión:", error);
        mostrarMensajeLogin("❌ Correo o contraseña incorrectos.");
    } finally {
        if (btnLogin) {
            btnLogin.disabled = false;
            btnLogin.textContent = "🔐 Iniciar sesión";
        }
    }
}

async function cargarPerfilUsuario(usuario) {
    if (!usuario) {
        mostrarLogin();
        return;
    }

    usuarioActual = usuario;

    try {
        const resultado = await supabaseClient
            .from("perfiles")
            .select("id, user_id, rol, ministerio, miembro_id")
            .eq("user_id", usuario.id)
            .single();

        if (resultado.error) {
            throw resultado.error;
        }

        if (!resultado.data) {
            throw new Error("Este usuario no tiene un perfil asignado.");
        }

        const rol = String(resultado.data.rol || "")
            .trim()
            .toLowerCase();

        const rolesPermitidos = [
            "admin",
            "administrador",
            "secretario",
            "pastor",
            "lider",
            "líder",
            "miembro"
        ];

        if (!rolesPermitidos.includes(rol)) {
            throw new Error("Rol de usuario no válido: " + resultado.data.rol);
        }

        rolUsuarioActual =
            rol === "admin" || rol === "administrador"
                ? "administrador"
                : rol === "líder"
                    ? "lider"
                    : rol;

        ministerioUsuarioActual =
            resultado.data.ministerio
                ? String(resultado.data.ministerio).trim()
                : null;

        miembroIdUsuarioActual =
            resultado.data.miembro_id !== null && resultado.data.miembro_id !== undefined
                ? Number(resultado.data.miembro_id)
                : null;

        perfilUsuarioActual = resultado.data;

        if (rolUsuarioActual === "lider" && !ministerioUsuarioActual) {
            throw new Error("El perfil de Líder no tiene un ministerio asignado.");
        }

        if (rolUsuarioActual === "miembro" && !miembroIdUsuarioActual) {
            console.warn("⚠️ El usuario Miembro todavía no tiene miembro_id asignado.");
        }

        console.log("👤 Perfil:", {
            rol: rolUsuarioActual,
            ministerio: ministerioUsuarioActual,
            miembro_id: miembroIdUsuarioActual
        });

        mostrarSistema();
        iniciarAplicacionUnaVez();
        aplicarMinisterioSegunRol();
    } catch (error) {
        console.error("Error cargando perfil:", error);

        await supabaseClient.auth.signOut();

        mostrarLogin();
        mostrarMensajeLogin(
            "❌ " + (error.message || "No se pudo cargar el perfil.")
        );
    }
}

function esRolAdministrativo() {
    return ["administrador", "secretario"].includes(rolUsuarioActual);
}

function esRolConAccesoTotalLectura() {
    return ["administrador", "secretario", "pastor"].includes(rolUsuarioActual);
}

function esRolLider() {
    return rolUsuarioActual === "lider";
}

function esRolMiembro() {
    return rolUsuarioActual === "miembro";
}

function aplicarMinisterioSegunRol() {
    const ministerioElemento = document.getElementById("ministerio");
    if (!ministerioElemento) return;

    if (esRolLider()) {
        ministerioElemento.value = ministerioUsuarioActual || "";
        ministerioElemento.disabled = true;
        ministerioElemento.title = "El ministerio está determinado por el perfil del Líder.";
    } else {
        ministerioElemento.disabled = false;
        ministerioElemento.title = "";
    }
}

function miembroPerteneceAlAlcance(miembro) {
    if (!miembro || miembro.activo !== true) return false;

    if (esRolMiembro()) {
        return miembroIdUsuarioActual !== null && Number(miembro.id) === Number(miembroIdUsuarioActual);
    }

    if (esRolLider()) {
        return String(miembro.ministerio || "").trim().toLocaleLowerCase() ===
            String(ministerioUsuarioActual || "").trim().toLocaleLowerCase();
    }

    return true;
}

function filtrarMiembrosPorAlcance(miembros) {
    return (miembros || []).filter(miembroPerteneceAlAlcance);
}

function mostrarLogin() {
    if (pantallaLogin) {
        pantallaLogin.style.display = "flex";
    }

    if (usuarioConectado) {
        usuarioConectado.style.display = "none";
    }

    // Ocultar funciones del sistema mientras no haya sesión.
    const elementosSistema = [
        "seccionNuevoMiembro",
        "seccionMiembrosRegistrados",
        "seccionControlAsistencia",
        "formularioMiembro",
        "listaMiembros",
        "btnCargarAsistencia",
        "btnGuardarAsistencia",
        "listaAsistencia",
        "mesReporte",
        "btnVerReporte",
        "resultadoReporte",
        "resumenReporte"
    ];

    elementosSistema.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.style.display = "none";
        }
    });
}

function mostrarSistema() {
    if (pantallaLogin) pantallaLogin.style.display = "none";
    if (usuarioConectado) usuarioConectado.style.display = "flex";

    if (nombreUsuario) {
        nombreUsuario.textContent = usuarioActual ? (usuarioActual.email || "") : "";
    }

    if (rolUsuario) {
        const nombresRoles = {
            administrador: "Administrador",
            secretario: "Secretario",
            pastor: "Pastor",
            lider: ministerioUsuarioActual ? `Líder de ${ministerioUsuarioActual}` : "Líder",
            miembro: "Miembro"
        };
        rolUsuario.textContent = nombresRoles[rolUsuarioActual] || rolUsuarioActual;
    }

    const seccionNuevoMiembro = document.getElementById("seccionNuevoMiembro");
    const seccionMiembrosRegistrados = document.getElementById("seccionMiembrosRegistrados");
    const seccionControlAsistencia = document.getElementById("seccionAsistencia");
    const formularioMiembro = document.getElementById("memberForm");
    const listaMiembrosElemento = document.getElementById("listaMiembros");
    const botonCargarAsistencia = document.getElementById("btnCargarAsistencia");
    const botonGuardarAsistencia = document.getElementById("btnGuardarAsistencia");
    const listaAsistenciaElemento = document.getElementById("listaAsistencia");
    const seccionReporte = document.getElementById("seccionReporte");

    [
        seccionNuevoMiembro,
        seccionMiembrosRegistrados,
        seccionControlAsistencia,
        formularioMiembro,
        listaMiembrosElemento,
        botonCargarAsistencia,
        botonGuardarAsistencia,
        listaAsistenciaElemento,
        seccionReporte
    ].forEach(elemento => {
        if (elemento) elemento.style.display = "none";
    });

    if (rolUsuarioActual === "administrador" || rolUsuarioActual === "secretario") {
        [seccionNuevoMiembro, seccionMiembrosRegistrados, seccionControlAsistencia, seccionReporte]
            .forEach(e => { if (e) e.style.display = ""; });
        [formularioMiembro, listaMiembrosElemento, botonCargarAsistencia, botonGuardarAsistencia, listaAsistenciaElemento]
            .forEach(e => { if (e) e.style.display = ""; });
        return;
    }

    if (rolUsuarioActual === "pastor") {
        [seccionMiembrosRegistrados, seccionReporte]
            .forEach(e => { if (e) e.style.display = ""; });
        [listaMiembrosElemento]
            .forEach(e => { if (e) e.style.display = ""; });
        return;
    }

    if (rolUsuarioActual === "lider") {
        [seccionNuevoMiembro, seccionMiembrosRegistrados, seccionControlAsistencia, seccionReporte]
            .forEach(e => { if (e) e.style.display = ""; });
        [formularioMiembro, listaMiembrosElemento, botonCargarAsistencia, botonGuardarAsistencia, listaAsistenciaElemento]
            .forEach(e => { if (e) e.style.display = ""; });
        return;
    }

    if (rolUsuarioActual === "miembro") {
        [seccionMiembrosRegistrados, seccionReporte]
            .forEach(e => { if (e) e.style.display = ""; });
        if (listaMiembrosElemento) listaMiembrosElemento.style.display = "";
        return;
    }

    console.warn("⚠️ Rol desconocido:", rolUsuarioActual);
}

function mostrarMensajeLogin(mensaje) {
    if (mensajeLogin) {
        mensajeLogin.textContent = mensaje;
    }
}

async function cerrarSesion() {
    if (!confirm("¿Desea cerrar la sesión?")) {
        return;
    }

    try {
        const resultado = await supabaseClient.auth.signOut();

        if (resultado.error) {
            throw resultado.error;
        }

        usuarioActual = null;
        rolUsuarioActual = null;
        ministerioUsuarioActual = null;
        miembroIdUsuarioActual = null;
        perfilUsuarioActual = null;
        miembrosPermitidosActuales = [];
        aplicacionIniciada = false;

        if (formLogin) {
            formLogin.reset();
        }

        mostrarMensajeLogin("");
        mostrarLogin();

        console.log("🚪 Sesión cerrada.");
    } catch (error) {
        console.error("Error cerrando sesión:", error);

        alert(
            "❌ No se pudo cerrar la sesión.\n\n" +
            error.message
        );
    }
}


function agregarEstilosListaMiembros() {
    if (document.getElementById("estilosListaMiembros")) {
        return;
    }

    const estilo = document.createElement("style");
    estilo.id = "estilosListaMiembros";
    estilo.textContent = `
/* ==========================================================
   CORRECCIÓN: LISTA DE MIEMBROS CON BARRA DE DESPLAZAMIENTO
   ========================================================== */

#seccionMiembrosRegistrados {
    min-height: 0;
}

#listaMiembros {
    max-height: 520px;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 8px;
    scrollbar-gutter: stable;
}

#listaMiembros .miembro-card {
    margin-bottom: 10px;
}

#listaMiembros::-webkit-scrollbar {
    width: 10px;
}

#listaMiembros::-webkit-scrollbar-track {
    background: #eef2f5;
    border-radius: 10px;
}

#listaMiembros::-webkit-scrollbar-thumb {
    background: #1f4e79;
    border-radius: 10px;
}

#listaMiembros::-webkit-scrollbar-thumb:hover {
    background: #163a5c;
}

#listaMiembros {
    scrollbar-width: auto;
    scrollbar-color: #1f4e79 #eef2f5;
}

@media (max-width: 800px) {
    #listaMiembros {
        max-height: 60vh;
    }
}
`;
    document.head.appendChild(estilo);
}

// ==========================================================
// INICIAR APLICACIÓN
// ==========================================================

function iniciarAplicacionUnaVez() {
    if (aplicacionIniciada) {
        return;
    }

    aplicacionIniciada = true;

    agregarEstilosListaMiembros();

    console.log("🚀 Iniciando aplicación...");

    inicializarMiembros();
    inicializarAsistencia();
    agregarEstilosAsistenciaPorMinisterio();
    inicializarReporte();
    inicializarModalEditar();
}

// ==========================================================
// MIEMBROS
// ==========================================================

function inicializarMiembros() {
    memberForm = document.getElementById("memberForm");
    listaMiembros = document.getElementById("listaMiembros");
    buscar = document.getElementById("buscar");
    fotoInput = document.getElementById("foto");
    preview = document.getElementById("preview");

    if (fotoInput) {
        fotoInput.addEventListener("change", mostrarVistaPreviaFoto);
    }

    if (memberForm) {
        memberForm.addEventListener("submit", guardarMiembro);
    }

    if (buscar) {
        buscar.addEventListener("input", buscarMiembros);
    }

    cargarMiembros();
}

function mostrarVistaPreviaFoto() {
    const archivo =
        fotoInput && fotoInput.files
            ? fotoInput.files[0]
            : null;

    if (!archivo) {
        if (preview) {
            preview.src = "";
            preview.style.display = "none";
        }
        return;
    }

    const url = URL.createObjectURL(archivo);

    if (preview) {
        preview.src = url;
        preview.style.display = "inline-block";
    }
}

async function guardarMiembro(event) {
    event.preventDefault();

    const boton = document.querySelector(".btn-guardar");

    if (boton) {
        boton.disabled = true;
        boton.textContent = "⏳ Guardando...";
    }

    try {
        const nombreElemento = document.getElementById("nombre");
        const telefonoElemento = document.getElementById("telefono");
        const ministerioElemento = document.getElementById("ministerio");

        const nombre = nombreElemento
            ? nombreElemento.value.trim()
            : "";

        const telefono = telefonoElemento
            ? telefonoElemento.value.trim()
            : "";

        const ministerio = esRolLider()
            ? (ministerioUsuarioActual || "")
            : (ministerioElemento ? ministerioElemento.value : "");

        const foto =
            fotoInput && fotoInput.files
                ? fotoInput.files[0]
                : null;

        const diasSeleccionados = [];

        document
            .querySelectorAll('input[name="dias"]:checked')
            .forEach(checkbox => {
                diasSeleccionados.push(checkbox.value);
            });

        if (!nombre) {
            alert("Por favor, escriba el nombre del miembro.");
            return;
        }

        if (!ministerio) {
            alert("Por favor, seleccione el ministerio.");
            return;
        }

        if (diasSeleccionados.length === 0) {
            alert("Seleccione por lo menos un día de asistencia.");
            return;
        }

        let fotoUrl = null;

        if (foto) {
            fotoUrl = await subirFotoMiembro(foto, "nuevo");
        }

        const datosMiembro = {
            nombre,
            telefono,
            ministerio,
            foto_url: fotoUrl,
            lunes: diasSeleccionados.includes("lunes"),
            martes: diasSeleccionados.includes("martes"),
            miercoles: diasSeleccionados.includes("miercoles"),
            jueves: diasSeleccionados.includes("jueves"),
            viernes: diasSeleccionados.includes("viernes"),
            sabado: diasSeleccionados.includes("sabado"),
            domingo: diasSeleccionados.includes("domingo"),
            activo: true
        };

        const resultado = await supabaseClient
            .from("miembros")
            .insert(datosMiembro);

        if (resultado.error) {
            throw resultado.error;
        }

        alert("✅ Miembro guardado correctamente.");

        if (memberForm) {
            memberForm.reset();
        }

        if (preview) {
            preview.src = "";
            preview.style.display = "none";
        }

        await cargarMiembros();
    } catch (error) {
        console.error("Error guardando miembro:", error);

        alert(
            "❌ No se pudo guardar el miembro.\n\n" +
            error.message
        );
    } finally {
        if (boton) {
            boton.disabled = false;
            boton.textContent = "💾 Guardar miembro";
        }
    }
}

function obtenerExtension(nombreArchivo) {
    const partes = String(nombreArchivo || "").split(".");
    return (
        partes.length > 1
            ? partes.pop()
            : "jpg"
    ).toLowerCase();
}

async function subirFotoMiembro(archivo, prefijo) {
    const extension = obtenerExtension(archivo.name);

    const nombreArchivo =
        prefijo +
        "-" +
        Date.now() +
        "-" +
        Math.random().toString(36).substring(2) +
        "." +
        extension;

    const subida = await supabaseClient
        .storage
        .from("Fotos-Miembros")
        .upload(nombreArchivo, archivo);

    if (subida.error) {
        throw subida.error;
    }

    const publicUrl = supabaseClient
        .storage
        .from("Fotos-Miembros")
        .getPublicUrl(nombreArchivo);

    return publicUrl.data.publicUrl;
}

async function cargarMiembros() {
    if (!listaMiembros) return;

    listaMiembros.innerHTML = '<p class="mensaje">⏳ Cargando miembros...</p>';

    try {
        const resultado = await supabaseClient
            .from("miembros")
            .select("*")
            .eq("activo", true)
            .order("nombre", { ascending: true });

        if (resultado.error) throw resultado.error;

        miembrosPermitidosActuales = filtrarMiembrosPorAlcance(resultado.data || []);
        mostrarMiembros(miembrosPermitidosActuales);
    } catch (error) {
        console.error("Error cargando miembros:", error);
        listaMiembros.innerHTML = `
            <p class="mensaje">
                ❌ No se pudieron cargar los miembros.<br><br>
                ${escaparHTML(error.message || error)}
            </p>`;
    }
}

// ==========================================
// MOSTRAR MIEMBROS
// ==========================================

function mostrarMiembros(miembros) {

    if (!listaMiembros) return;

    const totalMiembros = Array.isArray(miembros)
        ? miembros.length
        : 0;

const contadorTotal = document.getElementById("totalMiembros");

if (contadorTotal) {
    contadorTotal.textContent = totalMiembros;
}
    if (!miembros || miembros.length === 0) {

        listaMiembros.innerHTML = `
            <div class="miembros-lista-contenido">
                <p class="mensaje">
                    Todavía no hay miembros registrados.
                </p>
            </div>

        `;

        return;
    }

    listaMiembros.innerHTML = `
        <div class="miembros-lista-contenido"></div>

    `;

    const contenedor =
        listaMiembros.querySelector(
            ".miembros-lista-contenido"
        );

    if (!contenedor) return;

    const puedeEditar =
        rolUsuarioActual === "administrador" ||
        rolUsuarioActual === "secretario";

    miembros.forEach(function (miembro) {

        const dias = obtenerDias(miembro);

        const tarjeta =
            document.createElement("div");

        tarjeta.className = "miembro-card";

        const fotoHTML = miembro.foto_url
            ? `
                <img
                    src="${escaparHTML(miembro.foto_url)}"
                    alt="Foto de ${escaparHTML(miembro.nombre)}"
                    class="miembro-foto"
                >
            `
            : `
                <div class="miembro-foto foto-default">
                    👤
                </div>
            `;

        tarjeta.innerHTML = `
            ${fotoHTML}

            <div class="miembro-info">

                <h3>
                    ${escaparHTML(
                        miembro.nombre || ""
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
                    📞
                    ${escaparHTML(
                        miembro.telefono ||
                        "Sin teléfono"
                    )}
                </p>

                <p>
                    📅
                    ${escaparHTML(
                        dias ||
                        "Sin días registrados"
                    )}
                </p>

            </div>

            ${
                puedeEditar
                    ? `
                        <div class="miembro-acciones">
                            <button
                                type="button"
                                class="btn-editar"
                                data-id="${escaparHTML(
                                    miembro.id
                                )}"
                            >
                                ✏️ Editar
                            </button>
                        </div>
                    `
                    : ""
            }
        `;

        if (puedeEditar) {

            const botonEditar =
                tarjeta.querySelector(".btn-editar");

            if (botonEditar) {

                botonEditar.addEventListener(
                    "click",
                    function () {
                        abrirModalEditar(miembro.id);
                    }
                );
            }
        }

        contenedor.appendChild(tarjeta);
    });
}

function escaparHTML(valor) {
    if (valor === null || valor === undefined) {
        return "";
    }

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Compatibilidad: algunas partes de asistencia usan escapeHTML.
function escapeHTML(valor) {
    return escaparHTML(valor);
}

function obtenerDias(miembro) {
    const dias = [];

    if (miembro.lunes) dias.push("Lunes");
    if (miembro.martes) dias.push("Martes");
    if (miembro.miercoles) dias.push("Miércoles");
    if (miembro.jueves) dias.push("Jueves");
    if (miembro.viernes) dias.push("Viernes");
    if (miembro.sabado) dias.push("Sábado");
    if (miembro.domingo) dias.push("Domingo");

    return dias.join(", ");
}

async function buscarMiembros() {
    if (!buscar) return;

    const texto = buscar.value.trim();

    if (!texto) {
        await cargarMiembros();
        return;
    }

    try {
        const resultado = await supabaseClient
            .from("miembros")
            .select("*")
            .eq("activo", true)
            .ilike("nombre", `%${texto}%`)
            .order("nombre", { ascending: true });

        if (resultado.error) throw resultado.error;

        const filtrados = filtrarMiembrosPorAlcance(resultado.data || []);
        miembrosPermitidosActuales = filtrados;
        mostrarMiembros(filtrados);
    } catch (error) {
        console.error("Error buscando miembros:", error);
    }
}

// ==========================================================
// MODAL EDITAR
// ==========================================================

function inicializarModalEditar() {
    modalEditar = document.getElementById("modalEditar");
    btnCerrarModal = document.getElementById("btnCerrarModal");
    btnCancelarEdicion = document.getElementById("btnCancelarEdicion");
    btnGuardarEdicion = document.getElementById("btnGuardarEdicion");
    editarId = document.getElementById("editarId");
    editarNombre = document.getElementById("editarNombre");
    editarTelefono = document.getElementById("editarTelefono");
    editarMinisterio = document.getElementById("editarMinisterio");
    editarFoto = document.getElementById("editarFoto");
    editarPreview = document.getElementById("editarPreview");
    formEditarMiembro = document.getElementById("formEditarMiembro");

    if (btnCerrarModal) {
        btnCerrarModal.addEventListener("click", cerrarModalEditar);
    }

    if (btnCancelarEdicion) {
        btnCancelarEdicion.addEventListener("click", cerrarModalEditar);
    }

    if (editarFoto) {
        editarFoto.addEventListener("change", vistaPreviaFotoEditar);
    }

    if (formEditarMiembro) {
        formEditarMiembro.addEventListener(
            "submit",
            guardarCambiosMiembro
        );
    }

    if (modalEditar) {
        modalEditar.addEventListener("click", event => {
            if (event.target === modalEditar) {
                cerrarModalEditar();
            }
        });
    }
}

async function abrirModalEditar(id) {

    if (!esRolAdministrativo()) {
        alert("❌ No tiene permisos para editar miembros.");
        return;
    }

    try {
        const resultado = await supabaseClient
            .from("miembros")
            .select("*")
            .eq("id", id)
            .single();

        if (resultado.error) {
            throw resultado.error;
        }

        const miembro = resultado.data;

        if (!miembro) {
            alert("No se encontró el miembro.");
            return;
        }

        if (editarId) editarId.value = miembro.id;
        if (editarNombre) editarNombre.value = miembro.nombre || "";
        if (editarTelefono) editarTelefono.value = miembro.telefono || "";

        const ministerioOriginal =
            document.getElementById("ministerio");

        if (
            ministerioOriginal &&
            editarMinisterio
        ) {
            editarMinisterio.innerHTML =
                ministerioOriginal.innerHTML;
        }

        if (editarMinisterio) {
            editarMinisterio.value =
                miembro.ministerio || "";
        }

        document
            .querySelectorAll('input[name="editarDias"]')
            .forEach(checkbox => {
                checkbox.checked =
                    miembro[checkbox.value] === true;
            });

        if (editarFoto) {
            editarFoto.value = "";
        }

        if (editarPreview) {
            if (miembro.foto_url) {
                editarPreview.src = miembro.foto_url;
                editarPreview.style.display = "block";
            } else {
                editarPreview.src = "";
                editarPreview.style.display = "none";
            }
        }

        if (modalEditar) {
            modalEditar.classList.add("mostrar");
        }

        document.body.classList.add("modal-abierto");
    } catch (error) {
        console.error("Error cargando miembro:", error);

        alert(
            "❌ No se pudo cargar el miembro.\n\n" +
            error.message
        );
    }
}

function cerrarModalEditar() {
    if (!modalEditar) {
        return;
    }

    modalEditar.classList.remove("mostrar");
    document.body.classList.remove("modal-abierto");

    if (formEditarMiembro) {
        formEditarMiembro.reset();
    }

    if (editarPreview) {
        editarPreview.src = "";
        editarPreview.style.display = "none";
    }
}

function vistaPreviaFotoEditar() {
    if (!editarFoto || !editarPreview) {
        return;
    }

    const archivo = editarFoto.files[0];

    if (!archivo) {
        return;
    }

    const url = URL.createObjectURL(archivo);

    editarPreview.src = url;
    editarPreview.style.display = "block";
}

async function guardarCambiosMiembro(event) {
    event.preventDefault();

    const id = editarId ? editarId.value : "";
    const nombre = editarNombre
        ? editarNombre.value.trim()
        : "";
    const telefono = editarTelefono
        ? editarTelefono.value.trim()
        : "";
    const ministerio = editarMinisterio
        ? editarMinisterio.value
        : "";

    const foto =
        editarFoto && editarFoto.files
            ? editarFoto.files[0]
            : null;

    if (!id) {
        alert("No se encontró el ID del miembro.");
        return;
    }

    if (!nombre) {
        alert("Por favor, escriba el nombre.");
        return;
    }

    if (!ministerio) {
        alert("Por favor, seleccione el ministerio.");
        return;
    }

    const diasSeleccionados = [];

    document
        .querySelectorAll('input[name="editarDias"]:checked')
        .forEach(checkbox => {
            diasSeleccionados.push(checkbox.value);
        });

    if (diasSeleccionados.length === 0) {
        alert("Seleccione por lo menos un día de asistencia.");
        return;
    }

    if (btnGuardarEdicion) {
        btnGuardarEdicion.disabled = true;
        btnGuardarEdicion.textContent = "⏳ Guardando...";
    }

    try {
        const datosActualizar = {
            nombre,
            telefono,
            ministerio,
            lunes: diasSeleccionados.includes("lunes"),
            martes: diasSeleccionados.includes("martes"),
            miercoles: diasSeleccionados.includes("miercoles"),
            jueves: diasSeleccionados.includes("jueves"),
            viernes: diasSeleccionados.includes("viernes"),
            sabado: diasSeleccionados.includes("sabado"),
            domingo: diasSeleccionados.includes("domingo")
        };

        if (foto) {
            datosActualizar.foto_url =
                await subirFotoMiembro(foto, "editar");
        }

        const resultado = await supabaseClient
            .from("miembros")
            .update(datosActualizar)
            .eq("id", id);

        if (resultado.error) {
            throw resultado.error;
        }

        alert("✅ Miembro actualizado correctamente.");

        cerrarModalEditar();
        await cargarMiembros();

        if (
            typeof cargarListaAsistencia === "function" &&
            fechaAsistencia &&
            servicioAsistencia &&
            fechaAsistencia.value &&
            servicioAsistencia.value
        ) {
            await cargarListaAsistencia();
        }

        if (btnVerReporte) {
            await cargarReporte();
        }
    } catch (error) {
        console.error("Error actualizando miembro:", error);

        alert(
            "❌ No se pudo actualizar el miembro.\n\n" +
            error.message
        );
    } finally {
        if (btnGuardarEdicion) {
            btnGuardarEdicion.disabled = false;
            btnGuardarEdicion.textContent = "💾 Guardar cambios";
        }
    }
}

// ==========================================
// INICIALIZAR ASISTENCIA
// ==========================================

function inicializarAsistencia() {
    fechaAsistencia = document.getElementById("fechaAsistencia");
    servicioAsistencia = document.getElementById("servicioAsistencia");
    btnCargarAsistencia = document.getElementById("btnCargarAsistencia");
    btnGuardarAsistencia = document.getElementById("btnGuardarAsistencia");
    listaAsistencia = document.getElementById("listaAsistencia");

    if (fechaAsistencia && !fechaAsistencia.value) {
        fechaAsistencia.value = fechaHoy();
    }

    if (btnCargarAsistencia) {
        btnCargarAsistencia.addEventListener("click", cargarListaAsistencia);
    }

    if (btnGuardarAsistencia) {
        btnGuardarAsistencia.addEventListener("click", guardarAsistencia);
    }

    if (fechaAsistencia) {
        fechaAsistencia.addEventListener("change", function () {
            actualizarServiciosPorFecha();

            if (listaAsistencia) {
                listaAsistencia.innerHTML =
                    '<p class="mensaje">Seleccione la fecha y el servicio para cargar la asistencia.</p>';
            }
        });
    }

    actualizarServiciosPorFecha();
}

// ==========================================
// SERVICIOS SEGÚN EL DÍA
// ==========================================

function agregarEstilosAsistenciaPorMinisterio() {
    if (document.getElementById("estilosAsistenciaMinisterios")) return;

    const style = document.createElement("style");
    style.id = "estilosAsistenciaMinisterios";
    style.textContent = `
        .asistencia-ministerio {
            display: flex;
            align-items: center;
            gap: 6px;
            margin: 14px 0 6px;
            padding: 7px 10px;
            border-radius: 6px;
            background: #e8eef5;
            color: #1f4e79;
            font-size: 14px;
            border-left: 4px solid #1f4e79;
        }

        .asistencia-ministerio:first-child {
            margin-top: 0;
        }
    `;
    document.head.appendChild(style);
}

function actualizarServiciosPorFecha() {
    if (!fechaAsistencia || !servicioAsistencia) return;

    const fecha = fechaAsistencia.value;
    const valorAnterior = servicioAsistencia.value;

    servicioAsistencia.innerHTML = "<option value=\"\">Seleccione un servicio</option>";

    if (!fecha) {
        servicioAsistencia.disabled = false;
        return;
    }

    const fechaObjeto = new Date(fecha + "T12:00:00");
    const diaSemana = fechaObjeto.getDay();
    const servicios = SERVICIOS_POR_DIA[diaSemana] || [];

    servicios.forEach(function (servicio) {
        const option = document.createElement("option");
        option.value = servicio.value;
        option.textContent = servicio.label;
        servicioAsistencia.appendChild(option);
    });

    if (servicios.some(function (s) { return s.value === valorAnterior; })) {
        servicioAsistencia.value = valorAnterior;
    } else if (servicios.length === 1) {
        servicioAsistencia.value = servicios[0].value;
    }

    servicioAsistencia.disabled = servicios.length === 0;

    if (servicios.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "No hay servicio programado este día";
        servicioAsistencia.appendChild(option);
        servicioAsistencia.value = "";
    }
}

// ==========================================
// FECHA HOY
// ==========================================

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

// ==========================================
// CARGAR ASISTENCIA
// ==========================================

async function cargarListaAsistencia() {
    if (!fechaAsistencia || !servicioAsistencia || !listaAsistencia) {
        return;
    }

    const fecha = fechaAsistencia.value;
    const servicio = servicioAsistencia.value;

    if (!fecha) {
        alert("Seleccione la fecha de la asistencia.");
        return;
    }

    if (!servicio) {
        alert("Seleccione el servicio o reunión.");
        return;
    }

    const fechaObjetoValidacion = new Date(fecha + "T12:00:00");
    const diaSemanaValidacion = fechaObjetoValidacion.getDay();
    const serviciosPermitidos = SERVICIOS_POR_DIA[diaSemanaValidacion] || [];

    if (!serviciosPermitidos.some(function (item) { return item.value === servicio; })) {
        alert("El servicio seleccionado no corresponde al día de la semana elegido.");
        actualizarServiciosPorFecha();
        return;
    }

    listaAsistencia.innerHTML =
        '<p class="mensaje">⏳ Cargando miembros...</p>';

    try {
        // --------------------------------------
        // MIEMBROS
        // --------------------------------------

        let {
            data: miembros,
            error: errorMiembros
        } = await supabaseClient
            .from("miembros")
            .select("*")
            .eq("activo", true)
            .order("nombre", { ascending: true });

        if (errorMiembros) {
            throw errorMiembros;
        }

        const miembrosFiltrados = filtrarMiembrosPorAlcance(miembros || []);
        miembrosPermitidosActuales = miembrosFiltrados;

        if (miembrosFiltrados.length === 0) {
            listaAsistencia.innerHTML =
                '<p class="sin-miembros">No hay miembros disponibles para su rol.</p>';
            return;
        }

        miembros = miembrosFiltrados;

        // --------------------------------------
        // ASISTENCIAS EXISTENTES
        // --------------------------------------

        const {
            data: asistenciasExistentes,
            error: errorAsistencias
        } = await supabaseClient
            .from("asistencias")
            .select("miembro_id")
            .eq("fecha", fecha)
            .eq("servicio", servicio);

        if (errorAsistencias) {
            throw errorAsistencias;
        }

        const idsAsistentes = new Set(
            (asistenciasExistentes || []).map(
                function (a) {
                    return a.miembro_id;
                }
            )
        );

        // --------------------------------------
        // DÍA DE LA SEMANA
        // --------------------------------------

        const fechaObjeto = new Date(
            fecha + "T12:00:00"
        );

        const diaSemana = fechaObjeto.getDay();

        const nombreDia = [
            "domingo",
            "lunes",
            "martes",
            "miercoles",
            "jueves",
            "viernes",
            "sabado"
        ][diaSemana];

        // --------------------------------------
        // ORDENAR: PRIMERO LOS QUE NORMALMENTE
        // ASISTEN ESE DÍA
        // --------------------------------------

        miembros.sort(function (a, b) {
            const ministerioA = (a.ministerio || "Sin ministerio").trim().toLocaleLowerCase();
            const ministerioB = (b.ministerio || "Sin ministerio").trim().toLocaleLowerCase();

            const ministerioCompare = ministerioA.localeCompare(ministerioB, "es", {
                sensitivity: "base"
            });

            if (ministerioCompare !== 0) {
                return ministerioCompare;
            }

            const aEsperado = a[nombreDia] ? 1 : 0;
            const bEsperado = b[nombreDia] ? 1 : 0;

            if (aEsperado !== bEsperado) {
                return bEsperado - aEsperado;
            }

            return (a.nombre || "").localeCompare(
                b.nombre || "",
                "es",
                { sensitivity: "base" }
            );
        });

        // --------------------------------------
        // MOSTRAR
        // --------------------------------------

        listaAsistencia.innerHTML = "";

        let ultimoMinisterio = null;

        miembros.forEach(function (miembro) {
            const ministerioActual = (miembro.ministerio || "Sin ministerio").trim() || "Sin ministerio";

            if (ministerioActual !== ultimoMinisterio) {
                const encabezadoMinisterio = document.createElement("div");
                encabezadoMinisterio.className = "asistencia-ministerio";
                encabezadoMinisterio.innerHTML = `
                    <span>👥</span>
                    <strong>${escapeHTML(ministerioActual)}</strong>
                `;
                listaAsistencia.appendChild(encabezadoMinisterio);
                ultimoMinisterio = ministerioActual;
            }

            const asistio =
                idsAsistentes.has(miembro.id);

            const normalmenteViene =
                miembro[nombreDia] === true;

            const fila =
                document.createElement("label");

            fila.className =
                "asistencia-miembro";

            const fotoHTML =
                miembro.foto_url
                    ? `
                        <img
                            src="${escapeHTML(miembro.foto_url)}"
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

            fila.innerHTML = `
                <input
                    type="checkbox"
                    class="check-asistencia"
                    data-miembro-id="${miembro.id}"
                    ${asistio ? "checked" : ""}
                >

                ${fotoHTML}

                <div class="asistencia-info">
                    <strong>
                        ${escapeHTML(miembro.nombre || "")}
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

            listaAsistencia.appendChild(fila);
        });

    } catch (error) {
        console.error("Error cargando asistencia:", error);

        listaAsistencia.innerHTML =
            `<p class="mensaje">
                ❌ Error cargando la asistencia.<br><br>
                ${escapeHTML(error.message || error)}
            </p>`;
    }
}


// ==========================================
// GUARDAR ASISTENCIA
// ==========================================

async function guardarAsistencia() {
    if (!fechaAsistencia || !servicioAsistencia || !listaAsistencia) {
        return;
    }

    const fecha = fechaAsistencia.value;
    const servicio = servicioAsistencia.value;

    if (!fecha) {
        alert("Seleccione la fecha.");
        return;
    }

    if (!servicio) {
        alert("Seleccione el servicio.");
        return;
    }

    const fechaObjetoValidacion = new Date(fecha + "T12:00:00");
    const diaSemanaValidacion = fechaObjetoValidacion.getDay();
    const serviciosPermitidos = SERVICIOS_POR_DIA[diaSemanaValidacion] || [];

    if (!serviciosPermitidos.some(function (item) { return item.value === servicio; })) {
        alert("El servicio seleccionado no corresponde al día de la semana elegido.");
        actualizarServiciosPorFecha();
        return;
    }

    const checkboxes =
        document.querySelectorAll(".check-asistencia");

    const idsPermitidos = new Set(
        (miembrosPermitidosActuales || []).map(m => Number(m.id))
    );

    if (checkboxes.length === 0) {
        alert("Primero debe cargar los miembros.");
        return;
    }

    if (btnGuardarAsistencia) {
        btnGuardarAsistencia.disabled = true;
        btnGuardarAsistencia.textContent = "⏳ Guardando...";
    }

    try {
        // --------------------------------------
        // BORRAR REGISTROS ANTERIORES
        // --------------------------------------

        const { error: errorDelete } =
            await supabaseClient
                .from("asistencias")
                .delete()
                .eq("fecha", fecha)
                .eq("servicio", servicio);

        if (errorDelete) {
            throw errorDelete;
        }

        // --------------------------------------
        // CREAR REGISTROS
        // --------------------------------------

        const registros = [];

        checkboxes.forEach(function (checkbox) {
            if (checkbox.checked) {
                const miembroId = Number(checkbox.dataset.miembroId);
                if (!idsPermitidos.has(miembroId)) return;

                registros.push({
                    miembro_id: miembroId,
                    fecha: fecha,
                    servicio: servicio,
                    asistio: true
                });
            }
        });

        // --------------------------------------
        // INSERTAR
        // --------------------------------------

        if (registros.length > 0) {
            const { error: errorInsert } =
                await supabaseClient
                    .from("asistencias")
                    .insert(registros);

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
        console.error("Error guardando asistencia:", error);

        alert(
            "❌ No se pudo guardar la asistencia.\n\n" +
            (error.message || error)
        );

    } finally {
        if (btnGuardarAsistencia) {
            btnGuardarAsistencia.disabled = false;
            btnGuardarAsistencia.textContent =
                "💾 Guardar asistencia";
        }
    }
}




// ==========================================================
// OBTENER DÍA DE LA SEMANA DESDE UNA FECHA
// ==========================================================
// Devuelve el nombre exacto de la propiedad usada en la tabla miembros.
function obtenerDiaDeFecha(fecha) {
    if (!fecha) {
        return "";
    }

    const fechaObjeto = new Date(String(fecha) + "T12:00:00");

    if (Number.isNaN(fechaObjeto.getTime())) {
        return "";
    }

    const dias = [
        "domingo",
        "lunes",
        "martes",
        "miercoles",
        "jueves",
        "viernes",
        "sabado"
    ];

    return dias[fechaObjeto.getDay()];
}

// ==========================================================
// REPORTE MENSUAL
// ==========================================================

function inicializarReporte() {
    tipoReporte = document.getElementById("tipoReporte");
    fechaReporte = document.getElementById("fechaReporte");
    mesReporte = document.getElementById("mesReporte");
    anioReporte = document.getElementById("anioReporte");
    btnVerReporte = document.getElementById("btnVerReporte");
    resultadoReporte = document.getElementById("resultadoReporte");
    resumenReporte = document.getElementById("resumenReporte");

    if (fechaReporte && !fechaReporte.value) fechaReporte.value = fechaHoy();
    if (mesReporte && !mesReporte.value) mesReporte.value = mesActual();
    if (anioReporte && !anioReporte.value) anioReporte.value = String(new Date().getFullYear());

    if (tipoReporte) {
        tipoReporte.addEventListener("change", actualizarControlesReporte);
    }

    if (btnVerReporte) {
        btnVerReporte.addEventListener("click", cargarReporte);
    }

    actualizarControlesReporte();
}

function actualizarControlesReporte() {
    const tipo = tipoReporte ? tipoReporte.value : "mes";
    const grupos = {
        fecha: document.getElementById("controlFechaReporte"),
        mes: document.getElementById("controlMesReporte"),
        anio: document.getElementById("controlAnioReporte")
    };

    Object.values(grupos).forEach(el => {
        if (el) el.style.display = "none";
    });

    if (tipo === "dia" && grupos.fecha) grupos.fecha.style.display = "";
    if (tipo === "semana" && grupos.fecha) grupos.fecha.style.display = "";
    if (tipo === "mes" && grupos.mes) grupos.mes.style.display = "";
    if (tipo === "anio" && grupos.anio) grupos.anio.style.display = "";
}

function mesActual() {
    const ahora = new Date();
    return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;
}

function obtenerRangoReporte() {
    const tipo = tipoReporte ? tipoReporte.value : "mes";

    if (tipo === "dia") {
        const fecha = fechaReporte ? fechaReporte.value : "";
        if (!fecha) throw new Error("Seleccione el día del reporte.");
        return { tipo, inicio: fecha, fin: fecha, etiqueta: `Día ${fecha}` };
    }

    if (tipo === "semana") {
        const fecha = fechaReporte ? fechaReporte.value : "";
        if (!fecha) throw new Error("Seleccione una fecha para calcular la semana.");

        const d = new Date(`${fecha}T12:00:00`);
        const dia = d.getDay();
        const diferenciaLunes = dia === 0 ? -6 : 1 - dia;
        const inicio = new Date(d);
        inicio.setDate(d.getDate() + diferenciaLunes);
        const fin = new Date(inicio);
        fin.setDate(inicio.getDate() + 6);

        const aFecha = fecha => {
            const y = fecha.getFullYear();
            const m = String(fecha.getMonth() + 1).padStart(2, "0");
            const day = String(fecha.getDate()).padStart(2, "0");
            return `${y}-${m}-${day}`;
        };

        return {
            tipo,
            inicio: aFecha(inicio),
            fin: aFecha(fin),
            etiqueta: `Semana del ${aFecha(inicio)} al ${aFecha(fin)}`
        };
    }

    if (tipo === "anio") {
        const anio = Number(anioReporte ? anioReporte.value : "");
        if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
            throw new Error("Seleccione un año válido.");
        }
        return { tipo, inicio: `${anio}-01-01`, fin: `${anio}-12-31`, etiqueta: `Año ${anio}` };
    }

    const mes = mesReporte ? mesReporte.value : "";
    if (!/^\d{4}-\d{2}$/.test(mes)) throw new Error("Seleccione un mes válido.");
    const [anio, numeroMes] = mes.split("-").map(Number);
    const ultimoDia = new Date(anio, numeroMes, 0).getDate();
    return {
        tipo: "mes",
        inicio: `${mes}-01`,
        fin: `${mes}-${String(ultimoDia).padStart(2, "0")}`,
        etiqueta: `Mes ${mes}`
    };
}

async function cargarReporte() {
    if (!btnVerReporte || !resultadoReporte || !resumenReporte) return;

    btnVerReporte.disabled = true;
    btnVerReporte.textContent = "⏳ Cargando...";
    resultadoReporte.innerHTML = '<p class="mensaje">⏳ Generando reporte...</p>';
    resumenReporte.innerHTML = "";

    try {
        const rango = obtenerRangoReporte();

        let consultaMiembros = supabaseClient
            .from("miembros")
            .select("*")
            .eq("activo", true)
            .order("nombre", { ascending: true });

        if (esRolMiembro()) {
            if (!miembroIdUsuarioActual) throw new Error("Este usuario Miembro todavía no tiene miembro_id asignado.");
            consultaMiembros = consultaMiembros.eq("id", miembroIdUsuarioActual);
        } else if (esRolLider()) {
            consultaMiembros = consultaMiembros.eq("ministerio", ministerioUsuarioActual);
        }

        const resultadoMiembros = await consultaMiembros;
        if (resultadoMiembros.error) throw resultadoMiembros.error;

        const miembros = resultadoMiembros.data || [];

        const resultadoAsistencias = await supabaseClient
            .from("asistencias")
            .select("miembro_id, fecha, servicio, asistio")
            .gte("fecha", rango.inicio)
            .lte("fecha", rango.fin)
            .order("fecha", { ascending: true });

        if (resultadoAsistencias.error) throw resultadoAsistencias.error;

        const miembrosIds = new Set(miembros.map(m => Number(m.id)));
        const asistencias = (resultadoAsistencias.data || []).filter(a => miembrosIds.has(Number(a.miembro_id)));

        const reunionesMap = new Map();
        asistencias.forEach(registro => {
            if (!registro.fecha || !registro.servicio) return;
            const clave = `${registro.fecha}|${registro.servicio}`;
            if (!reunionesMap.has(clave)) {
                reunionesMap.set(clave, { fecha: registro.fecha, servicio: registro.servicio });
            }
        });

        const reuniones = Array.from(reunionesMap.values());
        const asistenciasReales = new Set();

        asistencias.forEach(registro => {
            if (registro.asistio !== true) return;
            asistenciasReales.add(`${Number(registro.miembro_id)}|${registro.fecha}|${registro.servicio}`);
        });

        const resultados = miembros.map(miembro => {
            let reunionesEsperadas = 0;
            let reunionesAsistidas = 0;
            let reunionesAusentes = 0;

            reuniones.forEach(reunion => {
                const dia = obtenerDiaDeFecha(reunion.fecha);
                if (miembro[dia] !== true) return;

                reunionesEsperadas++;
                const clave = `${Number(miembro.id)}|${reunion.fecha}|${reunion.servicio}`;
                if (asistenciasReales.has(clave)) reunionesAsistidas++;
                else reunionesAusentes++;
            });

            const porcentaje = reunionesEsperadas > 0
                ? Math.min(100, Math.round((reunionesAsistidas / reunionesEsperadas) * 100))
                : 0;

            return { miembro, esperadas: reunionesEsperadas, asistencias: reunionesAsistidas, ausencias: reunionesAusentes, porcentaje };
        });

        const totalMiembros = miembros.length;
        const promedio = totalMiembros > 0
            ? Math.round(resultados.reduce((sum, r) => sum + r.porcentaje, 0) / totalMiembros)
            : 0;

        resumenReporte.innerHTML = `
            <div class="resumen-card"><span class="numero">${totalMiembros}</span><span class="texto">Miembros en el reporte</span></div>
            <div class="resumen-card"><span class="numero">${reuniones.length}</span><span class="texto">Reuniones registradas</span></div>
            <div class="resumen-card"><span class="numero">${promedio}%</span><span class="texto">Promedio de asistencia</span></div>
            <div class="resumen-card resumen-periodo"><span class="numero">${escaparHTML(rango.etiqueta)}</span><span class="texto">Período</span></div>
        `;

        if (resultados.length === 0) {
            resultadoReporte.innerHTML = '<p class="mensaje">No hay miembros dentro del alcance de este usuario.</p>';
            return;
        }

        resultadoReporte.innerHTML = "";

        resultados.forEach(resultado => {
            const miembro = resultado.miembro;
            const porcentaje = resultado.porcentaje;
            let clasePorcentaje = "porcentaje-sin-datos";
            let claseEstado = "estado-sin-datos";
            let textoEstado = "Sin datos";

            if (resultado.esperadas === 0) textoEstado = "Sin reuniones esperadas";
            else if (porcentaje >= 80) {
                clasePorcentaje = "porcentaje-alto";
                claseEstado = "estado-alto";
                textoEstado = "Buena asistencia";
            } else if (porcentaje >= 50) {
                clasePorcentaje = "porcentaje-medio";
                claseEstado = "estado-medio";
                textoEstado = "Asistencia regular";
            } else {
                clasePorcentaje = "porcentaje-bajo";
                claseEstado = "estado-bajo";
                textoEstado = "Baja asistencia";
            }

            const tarjeta = document.createElement("div");
            tarjeta.className = "reporte-miembro";

            const fotoHTML = miembro.foto_url
                ? `<img src="${escaparHTML(miembro.foto_url)}" alt="Foto de ${escaparHTML(miembro.nombre)}" class="reporte-foto">`
                : `<div class="reporte-foto" style="display:flex;align-items:center;justify-content:center;background:#e9eef3;font-size:25px;">👤</div>`;

            tarjeta.innerHTML = `
                ${fotoHTML}
                <div class="reporte-info">
                    <h3>${escaparHTML(miembro.nombre || "")}</h3>
                    <p>📞 ${escaparHTML(miembro.telefono || "Sin teléfono")}</p>
                    <p>⛪ ${escaparHTML(miembro.ministerio || "Sin ministerio")}</p>
                    <p>📅 ${escaparHTML(obtenerDias(miembro) || "Sin días registrados")}</p>
                </div>
                <div class="reporte-estadistica">
                    <div class="reporte-porcentaje ${clasePorcentaje}">${porcentaje}%</div>
                    <div class="reporte-detalle">${resultado.asistencias} de ${resultado.esperadas} reuniones esperadas</div>
                    <div class="reporte-detalle">${resultado.ausencias} ausencia${resultado.ausencias === 1 ? "" : "s"}</div>
                    <span class="estado-asistencia ${claseEstado}">${textoEstado}</span>
                </div>
            `;

            resultadoReporte.appendChild(tarjeta);
        });

        console.log("📊 Reporte generado:", { tipo: rango.tipo, inicio: rango.inicio, fin: rango.fin, miembros: totalMiembros, reuniones: reuniones.length, promedio });
    } catch (error) {
        console.error("Error generando reporte:", error);
        resultadoReporte.innerHTML = `<p class="mensaje">❌ No se pudo generar el reporte.<br><br>${escaparHTML(error.message || error)}</p>`;
    } finally {
        btnVerReporte.disabled = false;
        btnVerReporte.textContent = "📊 Ver reporte";
    }
}

// ==========================================================
// INICIO
// ==========================================================

async function iniciarSistema() {
    console.log("🔐 Iniciando sistema...");
    await inicializarAutenticacion();
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        iniciarSistema
    );
} else {
    iniciarSistema();
}

// ==========================================================
// FIN DE app.js
// ==========================================================
