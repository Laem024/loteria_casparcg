document.addEventListener("DOMContentLoaded", function () {
    let loteriaConfigs = [];
    let workers = [];

    async function cargarDatos() {
        const response = await fetch('loteria_data.json');
        return await response.json();
    }

    function actualizarUI(loteriaId, numeros) {
        const numerosContainer = document.getElementById(`numeros_${loteriaId}`);
        numerosContainer.innerHTML = '';

        numeros.forEach(numero => {
            const numeroElement = document.createElement('span');
            numeroElement.textContent = numero;
            numerosContainer.appendChild(numeroElement);
        });

        // Reubicar la tarjeta de la lotería actualizada al inicio del contenedor
        const loteriaDiv = document.getElementById(`loteria_${loteriaId}`);
        const loteriaContainer = document.getElementById('loteriaContainer');

        // Añadir la clase de animación para iniciar el efecto
        loteriaDiv.classList.add('animate-move');

        // Esperar el final de la animación antes de mover al inicio del contenedor
        setTimeout(() => {
            loteriaContainer.prepend(loteriaDiv);
            // Remover la clase de animación después de reubicar, para que pueda volver a aplicarse en futuras actualizaciones
            setTimeout(() => loteriaDiv.classList.remove('animate-move'), 50);
        }, 500); // Ajuste del tiempo de espera para coincidir con la duración de la animación
    }

    function iniciarLoteria(config, loteriaId) {
        // Crear el elemento contenedor de cada lotería
        const loteriaDiv = document.createElement('div');
        loteriaDiv.classList.add('loteria');
        loteriaDiv.id = `loteria_${loteriaId}`;

        // Crear y configurar la sección superior (logo y nombre)
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

        // Añadir la línea divisoria
        const divider = document.createElement('div');
        divider.classList.add('divider');
        loteriaDiv.appendChild(divider);

        // Crear el contenedor para los números
        const numerosContainer = document.createElement('div');
        numerosContainer.classList.add('numeros');
        numerosContainer.id = `numeros_${loteriaId}`;
        loteriaDiv.appendChild(numerosContainer);

        // Agregar la lotería al contenedor principal
        document.getElementById('loteriaContainer').appendChild(loteriaDiv);

        // Configurar el Worker para actualizar los números
        const worker = new Worker('loteria_worker.js');
        worker.postMessage({
            rango_inicial: config.rango_inicial,
            rango_numeros: config.rango_numeros,
            tiempo_actualizacion: config.tiempo_actualizacion,
            loteriaId: loteriaId,
            cantidad_numeros: config.cantidad_numeros
        });

        // Escuchar mensajes del Worker para actualizar los números en pantalla
        worker.onmessage = function (e) {
            const { loteriaId, numeros } = e.data;
            actualizarUI(loteriaId, numeros);
        };

        workers.push(worker); // Guardar el Worker en la lista para referencia futura
    }

    async function play() {
        loteriaConfigs = await cargarDatos();
        loteriaConfigs.forEach((config, index) => {
            iniciarLoteria(config, index + 1);
        });
    }

    play();
});
