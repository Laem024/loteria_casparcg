onmessage = function(e) {
    const { rango_inicial, rango_numeros, tiempo_actualizacion, loteriaId, cantidad_numeros } = e.data;

    function generarNumeroAleatorio(rangoInicial, rangoFinal) {
        return Math.floor(Math.random() * (rangoFinal - rangoInicial)) + rangoInicial;
    }

    // Función para generar números aleatorios y enviar al hilo principal
    function actualizarNumeros() {
        const numeros = [];
        for (let i = 0; i < cantidad_numeros; i++) {
            numeros.push(generarNumeroAleatorio(rango_inicial, rango_numeros));
        }

        // Enviar los números generados al hilo principal
        postMessage({ loteriaId, numeros });

        // Log para mostrar el proceso en la consola
        console.log(`Lotería ${loteriaId}: Números generados - ${numeros.join(', ')} | Timestamp: ${new Date().toISOString()}`);
    }

    // Generar números inicialmente y luego en intervalos
    actualizarNumeros();
    setInterval(actualizarNumeros, tiempo_actualizacion);
};
