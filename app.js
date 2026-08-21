```javascript
// ==========================================================
// CONTROL DE MIEMBROS Y ASISTENCIA
// app.js - VERSIÓN COMPLETA Y CORREGIDA
// ==========================================================

document.addEventListener("DOMContentLoaded", function () {

    // ======================================================
    // CONFIGURACIÓN SUPABASE
    // ======================================================

    const SUPABASE_URL =
        "https://kjpwrpqlscitxyszsjkk.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_npgkf0Z40ecE7deKI7hHiw_ntgm0CJJ";

    // Verificar que la librería de Supabase esté cargada
    if (!window.supabase) {
        console.error(
            "❌ Supabase no está cargado. Verifique index.html."
        );

        mostrarErrorGeneral(
            "Supabase no está cargado. Verifique que index.html tenga la librería de Supabase antes de app.js."
        );

        return;
    }

    const supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );


    // ======================================================
    // CONFIGURACIÓN GENERAL
    // ======================================================

    const BUCKET_FOTOS = "Fotos-Miembros";

    const TIEMPO_MAXIMO = 15000;


    // ======================================================
    // ELEMENTOS - MIEMBROS
    // ======================================================

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


    // ======================================================
    // ELEMENTOS - MODAL EDITAR
    // ======================================================

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


    // ======================================================
    // ELEMENTOS - ASISTENCIA
    // ======================================================

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


    // ======================================================
    // ELEMENTOS - REPORTE
    // ======================================================

    const mesReporte =
        document.getElementById("mesReporte");

    const btnVerReporte =
        document.getElementById("btnVerReporte");

    const resultadoReporte =
        document.getElementById("resultadoReporte");

    const resumenReporte =
        document.getElementById("resumenReporte");


    // ======================================================
    // UTILIDADES
    // ======================================================

    function escapeHTML(valor) {

        return String(valor ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    function mostrarErrorGeneral(mensaje) {

        if (listaMiembros) {

            listaMiembros.innerHTML = `
                <p class="mensaje">
                    ❌ ${escapeHTML(mensaje)}
                </p>
            `;
        }

        if (listaAsistencia) {

            listaAsistencia.innerHTML = `
                <p class="mensaje">
                    ❌ ${escapeHTML(mensaje)}
                </p>
            `;
        }
    }


    function obtenerMensajeError(error) {

        if (!error) {
            return "Error desconocido.";
        }

        if (typeof error === "string") {
            return error;
        }

        return (
            error.message ||
            error.details ||
            error.hint ||
            error.code ||
            "Error desconocido de Supabase."
        );
    }


    // ======================================================
    // EJECUTAR CONSULTAS CON TIEMPO MÁXIMO
    // ======================================================

    async function esperarConTiempoMaximo(
        promesa,
        descripcion = "operación"
    ) {

        let temporizador;

        const timeout = new Promise(
            function (_, reject) {

                temporizador = setTimeout(
                    function () {

                        reject(
                            new Error(
                                "La operación tardó demasiado: " +
                                descripcion +
                                ". Verifique su conexión a Internet y las políticas de Supabase."
                            )
                        );

                    },
                    TIEMPO_MAXIMO
                );
            }
        );

        try {

            return await Promise.race([
                promesa,
                timeout
            ]);

        } finally {

            clearTimeout(temporizador);
        }
    }


    // ======================================================
    // CONVERTIR ID
    // ======================================================

    function prepararIdParaGuardar(id) {

        const valor = String(id ?? "").trim();

        if (valor === "") {
            return valor;
        }

        // Si es un número entero, mantener compatibilidad
        // con tablas cuyo ID sea bigint/integer.
        if (/^\d+$/.test(valor)) {
            return Number(valor);
        }

        // Si es UUID u otro identificador textual,
        // conservarlo como texto.
        return valor;
    }


    function compararIds(a, b) {

        return String(a) === String(b);
    }


    // ======================================================
    // OBTENER DÍAS
    // ======================================================

    function obtenerDias(miembro) {

        const dias = [];

        if (miembro.lunes === true) {
            dias.push("Lunes");
        }

        if (miembro.martes === true) {
            dias.push("Martes");
        }

        if (miembro.miercoles === true) {
            dias.push("Miércoles");
        }

        if (miembro.jueves === true) {
            dias.push("Jueves");
        }

        if (miembro.viernes === true) {
            dias.push("Viernes");
        }

        if (miembro.sabado === true) {
            dias.push("Sábado");
        }

        if (miembro.domingo === true) {
            dias.push("Domingo");
        }

        return dias.join(", ");
    }


    // ======================================================
    // OBTENER NOMBRE DEL DÍA
    // ======================================================

    function obtenerNombreDia(fecha) {

        const fechaObjeto =
            new Date(fecha + "T12:00:00");

        const diaSemana =
            fechaObjeto.getDay();

        return [
            "domingo",
            "lunes",
            "martes",
            "miercoles",
            "jueves",
            "viernes",
            "sabado"
        ][diaSemana];
    }


    // ======================================================
    // FECHA DE HOY
    // ======================================================

    function fechaHoy() {

        const ahora = new Date();

        const año =
            ahora.getFullYear();

        const mes =
            String(
                ahora.getMonth() + 1
            ).padStart(2, "0");

        const dia =
            String(
                ahora.getDate()
            ).padStart(2, "0");

        return `${año}-${mes}-${dia}`;
    }


    // ======================================================
    // MES ACTUAL
    // ======================================================

    function mesActual() {

        const ahora = new Date();

        const año =
            ahora.getFullYear();

        const mes =
            String(
                ahora.getMonth() + 1
            ).padStart(2, "0");

        return `${año}-${mes}`;
    }


    // ======================================================
    // VISTA PREVIA FOTO - NUEVO MIEMBRO
    // ======================================================

    if (fotoInput && preview) {

        fotoInput.addEventListener(
            "change",
            function () {

                const archivo =
                    fotoInput.files &&
                    fotoInput.files[0];

                if (!archivo) {

                    preview.src = "";
                    preview.style.display = "none";

                    return;
                }

                preview.src =
                    URL.createObjectURL(archivo);

                preview.style.display =
                    "inline-block";
            }
        );
    }


    // ======================================================
    // SUBIR FOTO A SUPABASE
    // ======================================================

    async function subirFoto(
        archivo,
        prefijo = "foto"
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


        const resultado =
            await esperarConTiempoMaximo(

                supabaseClient
                    .storage
                    .from(BUCKET_FOTOS)
                    .upload(
                        nombreArchivo,
                        archivo
                    ),

                "subir fotografía"
            );


        if (resultado.error) {
            throw resultado.error;
        }


        const publicUrl =
            supabaseClient
                .storage
                .from(BUCKET_FOTOS)
                .getPublicUrl(
                    nombreArchivo
                );


        if (
            !publicUrl ||
            !publicUrl.data ||
            !publicUrl.data.publicUrl
        ) {

            throw new Error(
                "La fotografía fue subida, pero Supabase no pudo generar la URL pública."
            );
        }


        return publicUrl.data.publicUrl;
    }


    // ======================================================
    // GUARDAR NUEVO MIEMBRO
    // ======================================================

    if (memberForm) {

        memberForm.addEventListener(
            "submit",
            async function (event) {

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
                        (
                            document.getElementById(
                                "nombre"
                            )?.value || ""
                        ).trim();


                    const telefono =
                        (
                            document.getElementById(
                                "telefono"
                            )?.value || ""
                        ).trim();


                    const ministerio =
                        document.getElementById(
                            "ministerio"
                        )?.value || "";


                    const foto =
                        fotoInput?.files?.[0] ||
                        null;


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


                    // ------------------------------
                    // VALIDACIONES
                    // ------------------------------

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


                    // ------------------------------
                    // FOTO
                    // ------------------------------

                    let fotoUrl = null;


                    if (foto) {

                        fotoUrl =
                            await subirFoto(
                                foto,
                                "miembro"
                            );
                    }


                    // ------------------------------
                    // DATOS
                    // ------------------------------

                    const datosMiembro = {

                        nombre: nombre,

                        telefono: telefono,

                        ministerio: ministerio,

                        foto_url: fotoUrl,

                        lunes:
                            diasSeleccionados
                                .includes("lunes"),

                        martes:
                            diasSeleccionados
                                .includes("martes"),

                        miercoles:
                            diasSeleccionados
                                .includes("miercoles"),

                        jueves:
                            diasSeleccionados
                                .includes("jueves"),

                        viernes:
                            diasSeleccionados
                                .includes("viernes"),

                        sabado:
                            diasSeleccionados
                                .includes("sabado"),

                        domingo:
                            diasSeleccionados
                                .includes("domingo"),

                        activo: true
                    };


                    // ------------------------------
                    // INSERTAR
                    // ------------------------------

                    const resultado =
                        await esperarConTiempoMaximo(

                            supabaseClient
                                .from("miembros")
                                .insert(
                                    datosMiembro
                                ),

                            "guardar miembro"
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
                        obtenerMensajeError(error)
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


    // ======================================================
    // CARGAR MIEMBROS
    // ======================================================

    async function cargarMiembros() {

        if (!listaMiembros) {
            return;
        }


        listaMiembros.innerHTML =
            '<p class="mensaje">⏳ Cargando miembros...</p>';


        try {

            const resultado =
                await esperarConTiempoMaximo(

                    supabaseClient
                        .from("miembros")
                        .select("*")
                        .eq("activo", true)
                        .order(
                            "nombre",
                            {
                                ascending: true
                            }
                        ),

                    "cargar miembros"
                );


            if (resultado.error) {
                throw resultado.error;
            }


            const miembros =
                resultado.data || [];


            mostrarMiembros(miembros);


        } catch (error) {

            console.error(
                "ERROR SUPABASE - cargar miembros:",
                error
            );


            listaMiembros.innerHTML = `
                <p class="mensaje">
                    ❌ No se pudieron cargar los miembros.
                    <br><br>
                    <strong>
                        ${escapeHTML(
                            obtenerMensajeError(error)
                        )}
                    </strong>
                    <br><br>
                    Verifique las políticas RLS de la tabla
                    "miembros" en Supabase.
                </p>
            `;
        }
    }


    // ======================================================
    // MOSTRAR MIEMBROS
    // ======================================================

    function mostrarMiembros(miembros) {

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


        listaMiembros.innerHTML = "";


        miembros.forEach(
            function (miembro) {

                const dias =
                    obtenerDias(miembro);


                const tarjeta =
                    document.createElement(
                        "div"
                    );


                tarjeta.className =
                    "miembro-card";


                let fotoHTML = "";


                if (miembro.foto_url) {

                    fotoHTML = `
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

                    fotoHTML = `
                        <div
                            class="miembro-foto foto-default"
                        >
                            👤
                        </div>
                    `;
                }


                tarjeta.innerHTML = `

                    ${fotoHTML}

                    <div class="miembro-info">

                        <h3>
                            ${escapeHTML(
                                miembro.nombre || ""
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


    // ======================================================
    // ABRIR MODAL EDITAR
    // ======================================================

    async function abrirModalEditar(id) {

        if (!modalEditar) {
            return;
        }


        try {

            const resultado =
                await esperarConTiempoMaximo(

                    supabaseClient
                        .from("miembros")
                        .select("*")
                        .eq("id", id)
                        .single(),

                    "cargar miembro para editar"
                );


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


            // ------------------------------
            // MINISTERIO
            // ------------------------------

            if (editarMinisterio) {

                const ministerioOriginal =
                    document.getElementById(
                        "ministerio"
                    );


                if (
                    ministerioOriginal &&
                    ministerioOriginal.innerHTML
                ) {

                    editarMinisterio.innerHTML =
                        ministerioOriginal.innerHTML;
                }


                editarMinisterio.value =
                    miembro.ministerio || "";
            }


            // ------------------------------
            // DÍAS
            // ------------------------------

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


            // ------------------------------
            // FOTO
            // ------------------------------

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

            console.error(
                "Error cargando miembro:",
                error
            );


            alert(
                "❌ No se pudo cargar el miembro.\n\n" +
                obtenerMensajeError(error)
            );
        }
    }


    // ======================================================
    // CERRAR MODAL
    // ======================================================

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
                    event.target === modalEditar
                ) {

                    cerrarModalEditar();
                }
            }
        );
    }


    // ======================================================
    // VISTA PREVIA FOTO - EDITAR
    // ======================================================

    if (
        editarFoto &&
        editarPreview
    ) {

        editarFoto.addEventListener(
            "change",
            function () {

                const archivo =
                    editarFoto.files?.[0];


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


    // ======================================================
    // GUARDAR CAMBIOS DEL MIEMBRO
    // ======================================================

    if (formEditarMiembro) {

        formEditarMiembro.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const id =
                    editarId?.value || "";


                const nombre =
                    (
                        editarNombre?.value ||
                        ""
                    ).trim();


                const telefono =
                    (
                        editarTelefono?.value ||
                        ""
                    ).trim();


                const ministerio =
                    editarMinisterio?.value ||
                    "";


                const foto =
                    editarFoto?.files?.[0] ||
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


                if (btnGuardarEdicion) {

                    btnGuardarEdicion.disabled =
                        true;

                    btnGuardarEdicion.textContent =
                        "⏳ Guardando...";
                }


                try {

                    // --------------------------
                    // DÍAS
                    // --------------------------

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
                            "Seleccione por lo menos un día de asistencia."
                        );

                        return;
                    }


                    // --------------------------
                    // DATOS
                    // --------------------------

                    const datosActualizar = {

                        nombre:
                            nombre,

                        telefono:
                            telefono,

                        ministerio:
                            ministerio,

                        lunes:
                            diasSeleccionados
                                .includes("lunes"),

                        martes:
                            diasSeleccionados
                                .includes("martes"),

                        miercoles:
                            diasSeleccionados
                                .includes("miercoles"),

                        jueves:
                            diasSeleccionados
                                .includes("jueves"),

                        viernes:
                            diasSeleccionados
                                .includes("viernes"),

                        sabado:
                            diasSeleccionados
                                .includes("sabado"),

                        domingo:
                            diasSeleccionados
                                .includes("domingo")
                    };


                    // --------------------------
                    // FOTO NUEVA
                    // --------------------------

                    if (foto) {

                        const nuevaFoto =
                            await subirFoto(
                                foto,
                                "editar"
                            );


                        datosActualizar.foto_url =
                            nuevaFoto;
                    }


                    // --------------------------
                    // ACTUALIZAR
                    // --------------------------

                    const resultado =
                        await esperarConTiempoMaximo(

                            supabaseClient
                                .from("miembros")
                                .update(
                                    datosActualizar
                                )
                                .eq(
                                    "id",
                                    id
                                ),

                            "actualizar miembro"
                        );


                    if (resultado.error) {
                        throw resultado.error;
                    }


                    alert(
                        "✅ Miembro actualizado correctamente."
                    );


                    cerrarModalEditar();


                    await cargarMiembros();


                    // Si asistencia ya estaba
                    // seleccionada, actualizarla.

                    if (
                        fechaAsistencia &&
                        servicioAsistencia &&
                        fechaAsistencia.value &&
                        servicioAsistencia.value
                    ) {

                        await cargarListaAsistencia();
                    }


                } catch (error) {

                    console.error(
                        "Error actualizando miembro:",
                        error
                    );


                    alert(
                        "❌ No se pudo actualizar el miembro.\n\n" +
                        obtenerMensajeError(error)
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


    // ======================================================
    // BUSCAR MIEMBROS
    // ======================================================

    if (buscar) {

        buscar.addEventListener(
            "input",
            async function () {

                const texto =
                    buscar.value.trim();


                if (!texto) {

                    await cargarMiembros();

                    return;
                }


                if (!listaMiembros) {
                    return;
                }


                listaMiembros.innerHTML =
                    '<p class="mensaje">🔎 Buscando...</p>';


                try {

                    const resultado =
                        await esperarConTiempoMaximo(

                            supabaseClient
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
                                        ascending:
                                            true
                                    }
                                ),

                            "buscar miembros"
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


                    listaMiembros.innerHTML = `
                        <p class="mensaje">
                            ❌ Error buscando miembros.
                            <br><br>
                            ${escapeHTML(
                                obtenerMensajeError(error)
                            )}
                        </p>
                    `;
                }
            }
        );
    }


    // ======================================================
    // CONFIGURAR FECHA DE ASISTENCIA
    // ======================================================

    if (fechaAsistencia) {

        fechaAsistencia.value =
            fechaHoy();
    }


    // ======================================================
    // CARGAR ASISTENCIA
    // ======================================================

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


        const fecha =
            fechaAsistencia.value;


        const servicio =
            servicioAsistencia.value;


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


        listaAsistencia.innerHTML =
            '<p class="mensaje">⏳ Cargando miembros...</p>';


        try {

            // --------------------------------------
            // MIEMBROS
            // --------------------------------------

            const resultadoMiembros =
                await esperarConTiempoMaximo(

                    supabaseClient
                        .from("miembros")
                        .select("*")
                        .eq(
                            "activo",
                            true
                        )
                        .order(
                            "nombre",
                            {
                                ascending:
                                    true
                            }
                        ),

                    "cargar miembros para asistencia"
                );


            if (resultadoMiembros.error) {
                throw resultadoMiembros.error;
            }


            const miembros =
                resultadoMiembros.data || [];


            if (miembros.length === 0) {

                listaAsistencia.innerHTML =
                    `
                    <p class="sin-miembros">
                        No hay miembros registrados.
                    </p>
                    `;

                return;
            }


            // --------------------------------------
            // ASISTENCIAS EXISTENTES
            // --------------------------------------

            const resultadoAsistencias =
                await esperarConTiempoMaximo(

                    supabaseClient
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
                        ),

                    "consultar asistencia existente"
                );


            if (resultadoAsistencias.error) {
                throw resultadoAsistencias.error;
            }


            const asistenciasExistentes =
                resultadoAsistencias.data ||
                [];


            const idsAsistentes =
                new Set(
                    asistenciasExistentes.map(
                        function (registro) {

                            return String(
                                registro.miembro_id
                            );
                        }
                    )
                );


            // --------------------------------------
            // DÍA DE LA SEMANA
            // --------------------------------------

            const nombreDia =
                obtenerNombreDia(
                    fecha
                );


            // --------------------------------------
            // ORDENAR
            // PRIMERO LOS QUE NORMALMENTE
            // ASISTEN ESE DÍA
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


                    return (
                        String(
                            a.nombre || ""
                        ).localeCompare(
                            String(
                                b.nombre || ""
                            )
                        )
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
                            String(
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


                    let fotoHTML;


                    if (miembro.foto_url) {

                        fotoHTML = `
                            <img
                                src="${escapeHTML(
                                    miembro.foto_url
                                )}"
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
                            data-miembro-id="${escapeHTML(
                                miembro.id
                            )}"
                            ${asistio
                                ? "checked"
                                : ""}
                        >

                        ${fotoHTML}

                        <div
                            class="asistencia-info"
                        >

                            <strong>
                                ${escapeHTML(
                                    miembro.nombre ||
                                    ""
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
                                    <div
                                        class="asistira-label"
                                    >
                                        ✓ Normalmente
                                        asiste este día
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


            listaAsistencia.innerHTML = `
                <p class="mensaje">
                    ❌ Error cargando la asistencia.
                    <br><br>
                    <strong>
                        ${escapeHTML(
                            obtenerMensajeError(error)
                        )}
                    </strong>
                    <br><br>
                    Revise las políticas RLS
                    de "miembros" y
                    "asistencias".
                </p>
            `;
        }
    }


    // ======================================================
    // GUARDAR ASISTENCIA
    // ======================================================

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


        if (btnGuardarAsistencia) {

            btnGuardarAsistencia.disabled =
                true;

            btnGuardarAsistencia.textContent =
                "⏳ Guardando...";
        }


        try {

            // --------------------------------------
            // ELIMINAR REGISTROS ANTERIORES
            // PARA ESA FECHA Y SERVICIO
            // --------------------------------------

            const resultadoDelete =
                await esperarConTiempoMaximo(

                    supabaseClient
                        .from("asistencias")
                        .delete()
                        .eq(
                            "fecha",
                            fecha
                        )
                        .eq(
                            "servicio",
                            servicio
                        ),

                    "eliminar asistencia anterior"
                );


            if (resultadoDelete.error) {
                throw resultadoDelete.error;
            }


            // --------------------------------------
            // CREAR REGISTROS
            // --------------------------------------

            const registros = [];


            checkboxes.forEach(
                function (checkbox) {

                    if (!checkbox.checked) {
                        return;
                    }


                    const id =
                        checkbox.dataset
                            .miembroId;


                    registros.push({

                        miembro_id:
                            prepararIdParaGuardar(
                                id
                            ),

                        fecha:
                            fecha,

                        servicio:
                            servicio,

                        asistio:
                            true
                    });
                }
            );


            // --------------------------------------
            // INSERTAR
            // --------------------------------------

            if (
                registros.length > 0
            ) {

                const resultadoInsert =
                    await esperarConTiempoMaximo(

                        supabaseClient
                            .from("asistencias")
                            .insert(
                                registros
                            ),

                        "guardar asistencia"
                    );


                if (
                    resultadoInsert.error
                ) {

                    throw resultadoInsert.error;
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
                obtenerMensajeError(error)
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


    // ======================================================
    // CONFIGURAR REPORTE
    // ======================================================

    if (mesReporte) {

        mesReporte.value =
            mesActual();
    }


    if (btnVerReporte) {

        btnVerReporte.addEventListener(
            "click",
            cargarReporte
        );
    }


    // ======================================================
    // CARGAR REPORTE
    // ======================================================

    async function cargarReporte() {

        if (
            !mesReporte ||
            !resultadoReporte ||
            !resumenReporte
        ) {
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

            // --------------------------------------
            // FECHAS DEL MES
            // --------------------------------------

            const inicioMes =
                `${mes}-01`;


            const partesMes =
                mes.split("-");


            const año =
                Number(partesMes[0]);


            const numeroMes =
                Number(partesMes[1]);


            const ultimoDia =
                new Date(
                    año,
                    numeroMes,
                    0
                ).getDate();


            const finMes =
                `${mes}-${String(
                    ultimoDia
                ).padStart(2, "0")}`;


            // --------------------------------------
            // MIEMBROS
            // --------------------------------------

            const resultadoMiembros =
                await esperarConTiempoMaximo(

                    supabaseClient
                        .from("miembros")
                        .select("*")
                        .eq(
                            "activo",
                            true
                        )
                        .order(
                            "nombre",
                            {
                                ascending:
                                    true
                            }
                        ),

                    "cargar miembros para reporte"
                );


            if (resultadoMiembros.error) {
                throw resultadoMiembros.error;
            }


            const miembros =
                resultadoMiembros.data ||
                [];


            // --------------------------------------
            // ASISTENCIAS
            // --------------------------------------

            const resultadoAsistencias =
                await esperarConTiempoMaximo(

                    supabaseClient
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
                        ),

                    "cargar asistencias del reporte"
                );


            if (
                resultadoAsistencias.error
            ) {

                throw resultadoAsistencias.error;
            }


            const asistencias =
                resultadoAsistencias.data ||
                [];


            // --------------------------------------
            // REUNIONES ÚNICAS
            // --------------------------------------

            const reuniones =
                new Set();


            asistencias.forEach(
                function (registro) {

                    reuniones.add(
                        registro.fecha +
                        "|" +
                        registro.servicio
                    );
                }
            );


            const totalReuniones =
                reuniones.size;


            // --------------------------------------
            // RESULTADOS
            // --------------------------------------

            const resultados =
                miembros.map(
                    function (miembro) {

                        let esperadas = 0;

                        let asistenciasMiembro =
                            0;


                        // --------------------------
                        // REUNIONES ESPERADAS
                        // --------------------------

                        reuniones.forEach(
                            function (
                                reunion
                            ) {

                                const partes =
                                    reunion.split(
                                        "|"
                                    );


                                const fecha =
                                    partes[0];


                                const nombreDia =
                                    obtenerNombreDia(
                                        fecha
                                    );


                                if (
                                    miembro[
                                        nombreDia
                                    ] === true
                                ) {

                                    esperadas++;
                                }
                            }
                        );


                        // --------------------------
                        // ASISTENCIAS
                        // --------------------------

                        asistencias.forEach(
                            function (
                                registro
                            ) {

                                if (
                                    !compararIds(
                                        registro.miembro_id,
                                        miembro.id
                                    )
                                ) {

                                    return;
                                }


                                if (
                                    registro.asistio !==
                                    true
                                ) {

                                    return;
                                }


                                const nombreDia =
                                    obtenerNombreDia(
                                        registro.fecha
                                    );


                                if (
                                    miembro[
                                        nombreDia
                                    ] === true
                                ) {

                                    asistenciasMiembro++;
                                }
                            }
                        );


                        // --------------------------
                        // PORCENTAJE
                        // --------------------------

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

                            porcentaje = 100;
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


            // --------------------------------------
            // RESUMEN
            // --------------------------------------

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
                    ? Math.round(
                        sumaPorcentajes /
                        totalMiembros
                    )
                    : 0;


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


            // --------------------------------------
            // SIN MIEMBROS
            // --------------------------------------

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


            // --------------------------------------
            // MOSTRAR RESULTADOS
            // --------------------------------------

            resultadoReporte.innerHTML =
                "";


            resultados.forEach(
                function (resultado) {

                    const miembro =
                        resultado.miembro;


                    const porcentaje =
                        resultado.porcentaje;


                    let clasePorcentaje =
                        "porcentaje-sin-datos";


                    let claseEstado =
                        "estado-sin-datos";


                    let textoEstado =
                        "Sin datos";


                    if (
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

                    } else if (
                        resultado.esperadas >
                        0
                    ) {

                        clasePorcentaje =
                            "porcentaje-bajo";

                        claseEstado =
                            "estado-bajo";

                        textoEstado =
                            "Baja asistencia";
                    }


                    const tarjeta =
                        document.createElement(
                            "div"
                        );


                    tarjeta.className =
                        "reporte-miembro";


                    let fotoHTML;


                    if (
                        miembro.foto_url
                    ) {

                        fotoHTML = `
                            <img
                                src="${escapeHTML(
                                    miembro.foto_url
                                )}"
                                alt="Foto"
                                class="reporte-foto"
                            >
                        `;

                    } else {

                        fotoHTML = `
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


                    tarjeta.innerHTML = `

                        ${fotoHTML}


                        <div class="reporte-info">

                            <h3>
                                ${escapeHTML(
                                    miembro.nombre ||
                                    ""
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
                                    "Sin días registrados"
                                )}
                            </p>

                        </div>


                        <div class="reporte-estadistica">

                            <div
                                class="reporte-porcentaje
                                ${clasePorcentaje}"
                            >
                                ${porcentaje}%
                            </div>


                            <div class="reporte-detalle">

                                ${
                                    resultado.asistencias
                                }

                                de

                                ${
                                    resultado.esperadas
                                }

                                reuniones esperadas

                            </div>


                            <span
                                class="estado-asistencia
                                ${claseEstado}"
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


        } catch (error) {

            console.error(
                "Error reporte:",
                error
            );


            resultadoReporte.innerHTML = `
                <p class="mensaje">
                    ❌ No se pudo generar el reporte.
                    <br><br>
                    <strong>
                        ${escapeHTML(
                            obtenerMensajeError(error)
                        )}
                    </strong>
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


    // ======================================================
    // INICIAR APLICACIÓN
    // ======================================================

    console.log(
        "✅ Registro-Iglesia iniciado."
    );

    console.log(
        "✅ Conectado a Supabase:",
        SUPABASE_URL
    );


    cargarMiembros();

});
```
