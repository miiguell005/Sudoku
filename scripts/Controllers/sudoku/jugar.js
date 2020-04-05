/*
 * Desarrollado por Miguel Alejandro Rodriguez 
 * miiguell005@gmail.com
 */
angular.module('sudokuModule')
  .controller('sudokuController', function ($scope, $routeParams, $window, $interval) {

    var vm = this;

    vm.cronometro;

    vm.dificultad = $routeParams.dificultad;

    //Contiene los valores de los botones
    vm.botones = [{
      row1: [
        { valor: 1 },
        { valor: 2 },
        { valor: 3 },
        { valor: 4 },
        { valor: 5 }
      ]
    },
    {
      row2: [
        { valor: 6 },
        { valor: 7 },
        { valor: 8 },
        { valor: 9 },
        //{ valor: "borrar" },
      ]
    }];

    //Contiene la cantidad de vidas que tiene el usuario para colocar el número correcto en el sudoku
    vm.vidas = 3;

    //Guarda el boton seleccionado
    vm.botonSeleccionado = null;

    //Guarda el tablero ya solucionado
    vm.tablero = [];

    //Lleva la cuenta de los números correctos que se han colocado en el tablero
    vm.cuentaNumerosColocados = {};

    //Maneja el interval del cronometro
    vm.intervalCronometro;

    /**
     *Función de inicio
     */
    vm.init = function () {

      var numerosDestapados = vm.obtenerValorDificultad();
      
      vm.vidas = 3;
      vm.tablero = [];
      vm.cuentaNumerosColocados = {};
      vm.cronometro = { fecha: moment("00:00:00", "HH:mm:ss"), detalle: moment("00:00:00", "HH:mm:ss").format("HH:mm:ss") };

      vm.tablero = vm.llenartablero(9, 3);

      vm.desordenarSudoku(numerosDestapados);

      vm.mostrarValoresAleatorios(numerosDestapados, vm.tablero);

      //Inicializa el cronometro y se ejecuta cada segundo
      vm.intervalCronometro = $interval(vm.iniciarCronometro, 1000);
      
    }

    /**
     * retorna la cantidad de números que van a ser destapados por medio de la dificultad seleccionada
     */
    vm.obtenerValorDificultad = function () {

      if (vm.dificultad == "muyFacil")
        return Math.floor(Math.random() * 25) + 35;

      else if (vm.dificultad == "facil")
        return Math.floor(Math.random() * 20) + 30;

      else if (vm.dificultad == "medio")
        return Math.floor(Math.random() * 20) + 20;

      else if (vm.dificultad == "dificil")
        return Math.floor(Math.random() * 15) + 15;

      else if (vm.dificultad == "muyDificil")
        return Math.floor(Math.random() * 15) + 8;

      else
        return Math.floor(Math.random() * 50) + 10;
    }

    /**
     * Permite llenar las filas
     */
    vm.llenartablero = function (numeroMaximo) {

      var tablero = [];

      for (var i = 1; i <= numeroMaximo; i++) {

        var fila = [];
        var index = 1;
        //Va llenando el sudoku
        for (var j = vm.generarConsecutivoLlenado(i, numeroMaximo, 3); j <= numeroMaximo; j++) {
          fila.push({ columna: j, index: index++ });

          //Comleta los números que hacen falta para completar el sudoku
          if (j == numeroMaximo && numeroMaximo != fila.length) {

            var kMax = numeroMaximo - fila.length;

            for (var k = 1; k <= kMax; k++)
              fila.push({ columna: k, index: index++ });

          }
        }

        tablero.push({ fila: fila, index: i });
      }

      return tablero;
    }

    /**
     * Genera la secuencia del sudoku inicial
     * @param {any} valor
     * @param {any} numeroMaximo
     * @param {any} columnas
     */
    vm.generarConsecutivoLlenado = function (valor, numeroMaximo, columnas) {

      var total = 0;

      var variador = columnas - 1;

      for (var i = 0; i <= 9999; i++) {

        total = valor * columnas - variador;

        if (total > numeroMaximo) {
          valor -= columnas;
          variador -= 1;
        }

        else
          break;
      }

      return total == 0 ? 1 : total;
    }

    /**
     * Muestra una cantidad de número  de la tabla, para que los demas sean resueltos por el usuario
     */
    vm.mostrarValoresAleatorios = function (cantMostrar, tabla) {

      var conteo = 0;

      while (conteo < cantMostrar) {

        var fila = Math.floor(Math.random() * tabla.length);
        var columna = Math.floor(Math.random() * tabla.length);

        var cell = vm.obtenerCeldaTabla(tabla, fila, columna);

        //Muestra la celda y marca la celda para que no se pueda editar
        if (!cell.mostrar) {

          vm.cuentaNumerosColocados[cell.columna] = vm.cuentaNumerosColocados[cell.columna] ? vm.cuentaNumerosColocados[cell.columna] + 1 : 1;

          cell.sinEdicion = true;
          cell.mostrar = true;
          conteo++;
        }
      }
    }

    /**
     * Obtiene la celda seleccionada por la fila y la columna
     * @param {any} tabla
     * @param {any} fila
     * @param {any} columna
     */
    vm.obtenerCeldaTabla = function (tabla, fila, columna) {

      var row = tabla[fila];

      return row.fila[columna];
    }

    /**
     * El jugador selecciona la celda que va a asignar el número seleccionado
     * @param {any} fila
     * @param {any} columna
     */
    vm.asignarNumeroJugador = function (fila, columna) {

      var cell = vm.obtenerCeldaTabla(vm.tablero, fila - 1, columna - 1);
            
      if (cell.mostrar == true)
        return;

      if (vm.botonSeleccionado && vm.botonSeleccionado == cell.columna) {

        cell.mostrar = true;

        //Lleva el conteo de los números del mismo valor
        vm.cuentaNumerosColocados[cell.columna] += 1;

        //Rectifica si el juego ya finalizo y no hace faltan más números por introducir
        vm.verificarJugoFinalizado();
      }

      else if (vm.botonSeleccionado && vm.botonSeleccionado != cell.columna) {

        vm.vidas -= 1;

        //Alerta al usuario que le hace falta N vidas
        if (vm.vidas > 0)
          console.log("Le quedan " + vm.vidas + "", "Has perdido una vida");
        //toastr.error("Le quedan " + vm.vidas + "", "Has perdido una vida");

        //Se acabaron las vidas, se notifica y se da la opción de crear un núevo juego
        else
          vm.mostrarMensaje("Has perdido todas las vidas");
      }
    }

    /**
     * Muestra una modal de confirmación
     */
    vm.mostrarMensaje = function (mensaje) {

      vm.detenerCronometro();

      bootbox.confirm({
        message: mensaje,
        buttons: {
          confirm: {
            label: 'Reintentar',
            className: 'btn-success'
          },
          cancel: {
            label: 'Ir atrás',
            className: 'btn-danger'
          }
        },
        callback: function (result) {

          //Reinicia el juego
          if (result)
            vm.init();

          //Lo direcciona al menú
          else
            $window.location.href = "#!/sudoku";

          $scope.$apply();
        }
      });
    }

    /**
     * Se ejecuta cuando el usuario selecciona un número o cuando selecciona el botón de borrar
     */
    vm.seleccionarBotonMenu = function (valorBoton) {

      vm.botonSeleccionado = vm.botonSeleccionado == valorBoton ? null : valorBoton;
    }

    /**
     * Cuando el juego finaliza, muestra un mensaje diciendo que ya ha finalizado la partida     
     */
    vm.verificarJugoFinalizado = function () {

      var juegoFinalizado = true;

      for (var i = 1; i <= 9; i++)
        if (vm.cuentaNumerosColocados[i] != 9) {
          juegoFinalizado = false;
          break
        }

      //Muestra una modal
      if (juegoFinalizado) {

        //Faltaria guardar el tiempo que tardo en resolver el Sudoku
        vm.mostrarMensaje("<div style='font-size: 20px;'>Has ganado<br>Duración: " + vm.cronometro.detalle + "</div>");
      }
    }

    /**
     * Desordena el sudoku
     * @param {any} cantIteracion
     */
    vm.desordenarSudoku = function (cantIteraciones) {

      var contador = 0;

      while (contador < cantIteraciones) {

        //Números que se van a cambiar num1 con el num2
        var num1 = Math.floor(Math.random() * vm.tablero.length) + 1;

        var num2 = Math.floor(Math.random() * vm.tablero.length) + 1;

        while (num1 == num2)
          num2 = Math.floor(Math.random() * vm.tablero.length) + 1;

        var columnas = vm.tablero.length / 3;

        for (var i = 0; i < vm.tablero.length; i += columnas)
          for (var j = 0; j < vm.tablero.length; j += columnas)
            vm.cambiarNumeroCuadro(i, (i + 2), j, (j + 2), num1, num2);

        //lleva el conteo de las iteraciones de cambio de números
        contador++;
      }
    }

    /**
     * Realiza el cambio de los dos numeros en un respectivo cuadro del sudoku
     * @param {any} xInicio
     * @param {any} xFin
     * @param {any} yInicio
     * @param {any} yFin
     * @param {any} num1
     * @param {any} num2
     */
    vm.cambiarNumeroCuadro = function (xInicio, xFin, yInicio, yFin, num1, num2) {

      for (var i = xInicio; i <= xFin; i++) {

        var fila = vm.tablero[i].fila;
        for (var j = yInicio; j <= yFin; j++) {

          //Realiza el cambio de número
          if (fila[j].columna == num1)
            fila[j].columna = num2;

          else if (fila[j].columna == num2)
            fila[j].columna = num1;
        }
      }

    }

    /**
     * Comienza a correr el cronometro
     */
    vm.iniciarCronometro = function () {

      vm.cronometro.fecha = vm.cronometro.fecha.add(1, 's');
      vm.cronometro.detalle = vm.cronometro.fecha.format("HH:mm:ss");

    };

    /**
     * Detiene el interval
     */
    vm.detenerCronometro = function () {
      $interval.cancel(vm.intervalCronometro);
    }

    /*
     * Se ejecuta antes de que se destruya el controlador (cuando se cambia de página) y detiene el interval del cronometro
     */
    $scope.$on('$destroy', function () {
      vm.detenerCronometro();
    });

    vm.init();

  });
