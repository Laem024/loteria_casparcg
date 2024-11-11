document.addEventListener("DOMContentLoaded", function () {
    let loteriaConfigs = [];
    let workers = [];
    let cronometros = {};

    async function cargarDatos() {
        const response = await fetch('loteria_data.json');
        return await response.json();
    }

    function limpiarNumeros(loteriaId, colorLimpiar) {
        const numerosContainer = document.getElementById(`numeros_${loteriaId}`);
        const numeroElements = numerosContainer.querySelectorAll('span');
        const loteriaDiv = document.getElementById(`loteria_${loteriaId}`);
        const loteriaContainer = document.getElementById('loteriaContainer');

        // Aplicar animación de rebote y colocar la tarjeta al extremo izquierdo
        loteriaDiv.classList.add("bounce", "position-left");

        // Asegurarse de que la tarjeta esté en el frente visualmente
        loteriaContainer.prepend(loteriaDiv);

        // Aplicar animación de limpieza a cada cuadro de número
        numeroElements.forEach((numeroElement) => {
            numeroElement.textContent = ""; // Limpiar el contenido del número
            numeroElement.style.setProperty("--color-limpiar", colorLimpiar); // Aplicar color de limpieza
            numeroElement.classList.add("limpiar"); // Añadir clase para animación de degradado
        });

        // Remover las clases de animación después de que termine el rebote
        setTimeout(() => {
            loteriaDiv.classList.remove("bounce");
        }, 500); // Duración de la animación de rebote
    }

    async function mostrarNumerosConDelay(loteriaId, numeros) {
        const numerosContainer = document.getElementById(`numeros_${loteriaId}`);
        const loteriaDiv = document.getElementById(`loteria_${loteriaId}`);
        const loteriaContainer = document.getElementById('loteriaContainer');

        // Quitar la clase `position-left` para que la tarjeta vuelva a su posición original en el contenedor
        loteriaDiv.classList.remove("position-left");

        for (let i = 0; i < numeros.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar 5 segundos

            // Aplicar la animación de rebote cuando se muestra cada número
            loteriaDiv.classList.add('bounce');
            loteriaContainer.prepend(loteriaDiv); // Llevar la tarjeta al frente visualmente

            const numeroElement = numerosContainer.children[i];
            numeroElement.classList.remove("limpiar"); // Quitar clase de limpieza
            numeroElement.textContent = numeros[i]; // Mostrar el número

            // Quitar la clase de rebote después de que termine la animación
            setTimeout(() => {
                loteriaDiv.classList.remove('bounce');
            }, 500); // Duración de la animación de rebote
        }
    }

    function actualizarUI(loteriaId, numeros, intervalo, colorLimpiar) {
        const numerosContainer = document.getElementById(`numeros_${loteriaId}`);

        // Limpiar los números con animación
        limpiarNumeros(loteriaId, colorLimpiar);

        // Iniciar el cronómetro para la siguiente jugada mientras se muestran los números
        iniciarCronometro(loteriaId, intervalo);

        // Mostrar los números con delay de 5 segundos después de limpiar
        mostrarNumerosConDelay(loteriaId, numeros);

        // Actualizar la fecha y hora de la última jugada
        const ahora = new Date();
        const fechaActualizacion = document.getElementById(`ultima_jugada_${loteriaId}`);
        fechaActualizacion.textContent = `${ahora.toLocaleDateString()} ${ahora.toLocaleTimeString()}`;
    }

    function iniciarCronometro(loteriaId, intervalo) {
        clearInterval(cronometros[loteriaId]); // Limpiar cualquier cronómetro previo

        const cronometroDisplay = document.getElementById(`siguiente_jugada_${loteriaId}`);
        let tiempoRestante = intervalo / 1000; // Convertir a segundos

        cronometros[loteriaId] = setInterval(() => {
            // Mostrar el tiempo restante actual
            cronometroDisplay.textContent = `${tiempoRestante}s`;

            // Si el tiempo restante llega a 0, detiene el cronómetro y fuerza una actualización
            if (tiempoRestante <= 0) {
                clearInterval(cronometros[loteriaId]);
                solicitarActualizacion(loteriaId);
            } else {
                tiempoRestante--; // Restar después de mostrar el tiempo actual
            }
        }, 1000);
    }

    function solicitarActualizacion(loteriaId) {
        workers[loteriaId - 1].postMessage({ action: 'updateNow' });
    }

    function iniciarLoteria(config, loteriaId) {
        const loteriaDiv = document.createElement('div');
        loteriaDiv.classList.add('loteria');
        loteriaDiv.id = `loteria_${loteriaId}`;

        const loteriaHeader = document.createElement('div');
        loteriaHeader.classList.add('loteria-header');

        const logo = document.createElement('img');
        logo.src = config.logo_url;
        logo.alt = `${config.nombre} logo`;
        logo.classList.add('logo');
        loteriaHeader.appendChild(logo);

        const titulo = document.createElement('div');
        titulo.textContent = config.nombre;
        loteriaHeader.appendChild(titulo);

        loteriaDiv.appendChild(loteriaHeader);

        const divider = document.createElement('div');
        divider.classList.add('divider');
        loteriaDiv.appendChild(divider);

        const numerosContainer = document.createElement('div');
        numerosContainer.classList.add('numeros');
        numerosContainer.id = `numeros_${loteriaId}`;
        for (let i = 0; i < config.cantidad_numeros; i++) {
            const numeroElement = document.createElement('span');
            numerosContainer.appendChild(numeroElement);
        }
        loteriaDiv.appendChild(numerosContainer);

        const sectionInferior = document.createElement('div');
        sectionInferior.classList.add('section-inferior');
        loteriaDiv.appendChild(sectionInferior);

        const ultimaJugadaContainer = document.createElement('div');
        ultimaJugadaContainer.classList.add('info-container');
        ultimaJugadaContainer.innerHTML = `<div class="title">Última jugada</div><div class="value" id="ultima_jugada_${loteriaId}">-</div>`;
        sectionInferior.appendChild(ultimaJugadaContainer);

        const siguienteJugadaContainer = document.createElement('div');
        siguienteJugadaContainer.classList.add('info-container');
        siguienteJugadaContainer.innerHTML = `<div class="title">Siguiente jugada</div><div class="value" id="siguiente_jugada_${loteriaId}">-</div>`;
        sectionInferior.appendChild(siguienteJugadaContainer);

        document.getElementById('loteriaContainer').appendChild(loteriaDiv);

        const worker = new Worker('loteria_worker.js');
        worker.postMessage({
            rango_inicial: config.rango_inicial,
            rango_numeros: config.rango_numeros,
            tiempo_actualizacion: config.tiempo_actualizacion,
            loteriaId: loteriaId,
            cantidad_numeros: config.cantidad_numeros
        });

        worker.onmessage = function (e) {
            const { loteriaId, numeros } = e.data;
            actualizarUI(loteriaId, numeros, config.tiempo_actualizacion, config.color_limpiar);
        };

        workers.push(worker);
    }

    async function play() {
        loteriaConfigs = await cargarDatos();
        loteriaConfigs.forEach((config, index) => {
            iniciarLoteria(config, index + 1);
        });
    }

    play();
});
