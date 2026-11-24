window.FINALES = [
  {
    "module": 1,
    "id": "final-1",
    "type": "final",
    "case": "Una mariscadora puede dedicar la última marea de la temporada a recoger un lote para venderlo en otra isla por 132 € de hoy, o a guiar visitantes. El índice general de precios ha pasado inesperadamente de 100 a 120. En euros del año base, recoger el lote cuesta 18 €, guiar deja 42 € netos y retirar el lote reduce en 60 € el valor actual de las capturas futuras. En acceso abierto, ella soporta una quinta parte de esa pérdida. Con un derecho exclusivo y duradero soportaría la pérdida completa. El comprador mantiene su oferta en ambos regímenes.\n\nLa mariscadora también posee un bono del Estado que vence hoy y paga 1.200 € nominales fijos. La economía de las islas ha sufrido una mala temporada y su producción total ha caído. El banco central estudia si debe restringir el crédito.",
    "prompt": "¿Qué diagnóstico mide correctamente la ventaja de recoger el lote frente a guiar, el poder de compra del bono y lo que permiten inferir los datos agregados?",
    "options": [
      "La ventaja real es de 38 € en acceso abierto y de −10 € con derecho exclusivo. El bono compra el equivalente a 960 € del año base. La caída de la producción es compatible con una perturbación de oferta.",
      "La ventaja real es de 60 € en acceso abierto y de 12 € con derecho exclusivo. El bono compra el equivalente a 1.000 € del año base. La caída de la producción es compatible con una perturbación de oferta.",
      "La ventaja real es de 38 € en acceso abierto y de −10 € con derecho exclusivo. El bono compra el equivalente a 1.000 € del año base. Hace falta más información para atribuir la inflación a una expansión monetaria.",
      "La ventaja real es de 50 € en acceso abierto y de −10 € con derecho exclusivo. El bono compra el equivalente a 1.000 € del año base. La subida del índice demuestra que una restricción del crédito mejoraría la producción."
    ],
    "correctIndex": 2,
    "explanation": "Los 132 € de la venta equivalen a 132/1,20 = 110 € del año base. Tras cubrir los 18 € y el ingreso alternativo de 42 €, quedan 50 €. En acceso abierto, la mariscadora sacrifica además 60/5 = 12 € de capturas propias, de modo que recoger en vez de guiar le reporta 38 € más. Con el derecho exclusivo sacrifica 60 € y prefiere guiar, por una diferencia de 10 €. El acceso al mismo cliente permite especializarse, pero las reglas sobre el recurso cambian qué actividad conviene en el margen.\n\nEl bono conserva su importe nominal y compra 1.200/1,20 = 1.000 € del año base. Restarle directamente el 20 % daría 960 €. Las cifras 60 y 12 para la decisión de pesca mezclan euros nominales y reales. El cálculo de 50 € omite la parte del daño que ya recae sobre ella. Una contracción de oferta puede elevar los precios y reducir la producción. Para valorar la respuesta del banco central haría falta conocer también la situación monetaria y el efecto de la restricción sobre la actividad.\n\nLa pérdida de capturas futuras también cuenta para la riqueza de la isla. Bajo acceso abierto, la venta de hoy parece rentable a la mariscadora aunque guiar deje más valor para el conjunto. El derecho duradero hace que preservar la capacidad productiva futura entre en su cálculo de hoy."
  },
  {
    "module": 2,
    "id": "final-2",
    "type": "final",
    "case": "Ana puede dedicar una jornada a fabricar 6 filtros de agua o preparar 12 raciones. Teo puede fabricar 4 filtros o preparar 4 raciones. Pueden repartir su tiempo proporcionalmente. Ana necesita hasta dos filtros para usos de distinta prioridad. Cedería como máximo 2,4 raciones actuales por el primero y 1,2 por el segundo. Teo no necesita filtros para sí.\n\nTeo ofrece fabricarlos hoy por una tarifa de 3 raciones futuras por filtro, entregables en una semana. En las cantidades del caso, para Ana entregar una ración futura equivale a ceder 0,5 raciones actuales. Para Teo, recibirla equivale a obtener 0,6 actuales. Al contratar, ambos esperan que las raciones lleguen íntegras. Después, una avería imprevista reduce lo que llega a Teo a 1,5 raciones futuras por filtro contratado. Las alternativas de producción y las valoraciones se mantienen.",
    "prompt": "¿Cuántos filtros acuerdan inicialmente, qué tarifa por filtro habría hecho estrictamente ventajoso para ambos intercambiar también el segundo y qué gana o pierde Teo por filtro al evaluar el resultado real frente a preparar raciones?",
    "options": [
      "Acuerdan uno. Para intercambiar también el segundo, la tarifa tendría que superar 5/3 y ser inferior a 2,4 raciones futuras. Tras la avería, Teo pierde el equivalente a 0,1 raciones actuales por filtro.",
      "Acuerdan dos. Para intercambiar también el segundo, la tarifa tendría que superar 5/3 y ser inferior a 4 raciones futuras. Tras la avería, Teo pierde el equivalente a 0,1 raciones actuales por filtro.",
      "Acuerdan uno. Para intercambiar también el segundo, la tarifa tendría que superar 1 y ser inferior a 2,4 raciones futuras. Tras la avería, Teo pierde el equivalente a 0,1 raciones actuales por filtro.",
      "Acuerdan uno. Para intercambiar también el segundo, la tarifa tendría que superar 5/3 y ser inferior a 2,4 raciones futuras. Tras la avería, Teo gana el equivalente a 0,5 raciones actuales por filtro."
    ],
    "correctIndex": 0,
    "explanation": "Ana produce más de ambos bienes por jornada, pero sacrifica 2 raciones actuales al fabricar un filtro y Teo solo 1. A la tarifa inicial, Ana sacrifica el equivalente a 3 × 0,5 = 1,5 raciones actuales por filtro. Prefiere comprar el primero a fabricarlo o prescindir de él. Para el segundo solo cedería 1,2, así que prescinde de él. Teo espera recibir el equivalente a 3 × 0,6 = 1,8 por un filtro cuyo coste de oportunidad es 1, y acepta.\n\nPara una tarifa de r raciones futuras, Teo exige 0,6r > 1 y Ana exige 0,5r < 1,2 por el segundo. De ahí 5/3 < r < 2,4. El techo de 4 sale de usar el coste de fabricación de Ana en lugar de su valoración marginal del segundo filtro. Un suelo de 1 olvida la espera para Teo. Tras la avería recibe el equivalente a 1,5 × 0,6 = 0,9 actuales y pierde 0,1 respecto a su alternativa. La decisión tenía sentido antes de conocer la avería aunque el resultado la haya hecho decepcionante.\n\nLas raciones que Ana cedería por cada filtro expresan su disposición marginal a sustituir un bien por otro. Que esa cifra caiga de 2,4 a 1,2 explica por qué el mismo precio permite el primer intercambio y descarta el segundo."
  },
  {
    "module": 3,
    "id": "final-3",
    "type": "final",
    "case": "En una feria, cinco clientes comprarían un único tarro de conserva cada uno. Sus precios máximos son 22, 18, 14, 9 y 4 €. Para tres tarros sucesivos, el obrador A tiene costes marginales de oportunidad de 4, 10 y 19 €. Para dos tarros, el obrador B tiene costes de 6 y 15 €. Todos compran y venden al precio común de 12 € si les compensa.\n\nEn la feria siguiente se encarece un complemento de la conserva y el máximo de cada cliente cae 3 €. En A, una técnica nueva ahorra 4 € por tarro, pero una mejora en la mejor alternativa de uso de sus instalaciones eleva en 1 € el coste de oportunidad de cada tarro. Ambos cambios afectan a todas las unidades de A. B mantiene sus costes. El nuevo precio común es 8 €.",
    "prompt": "¿Qué explicación concuerda con los cambios de curvas, las variaciones de excedente por feria y lo que ocurriría a 8 € si A no hubiera adoptado la técnica, manteniendo todos los demás cambios?",
    "options": [
      "La demanda se desplaza a la izquierda y la oferta de A a la derecha. El excedente comprador sube 3 € y el productor baja 4 €. Sin la técnica, a 8 € faltaría un tarro.",
      "Los compradores se mueven sobre su curva original y la oferta de A se desplaza a la derecha. El excedente comprador sube 12 € y el productor baja 6 €. Sin la técnica, a 8 € faltaría un tarro.",
      "La demanda se desplaza a la izquierda y la oferta de A a la derecha. El excedente comprador sube 3 € y el productor baja 6 €. Sin la técnica, a 8 € seguirían coincidiendo los planes de compra y venta.",
      "La demanda se desplaza a la izquierda y la oferta de A a la derecha. El excedente comprador sube 3 € y el productor baja 6 €. Sin la técnica, a 8 € faltaría un tarro."
    ],
    "correctIndex": 3,
    "explanation": "En la primera feria se intercambian tres tarros. Los compradores obtienen (22 + 18 + 14) − 3 × 12 = 18 €. Para hallar el excedente productor se reúnen las unidades de ambos obradores que cubren su coste al precio común. Así se obtienen 3 × 12 − (4 + 6 + 10) = 16 €.\n\nEn la segunda feria los máximos pasan a 19, 15, 11, 6 y 1 €. A pasa a tener costes de 1, 7 y 16 €, y B conserva 6 y 15 €. Se vuelven a intercambiar tres tarros, con excedentes de 19 + 15 + 11 − 24 = 21 € y 24 − (1 + 6 + 7) = 10 €. Los cambios son +3 y −6 €. La caída de los máximos desplaza la demanda aunque el menor precio propio anime a comprar. Mantener las valoraciones antiguas daría el aumento ficticio de 12 €. Omitir el mayor coste de oportunidad de A explicaría la caída aparente de solo 4 € en el excedente productor.\n\nSin la técnica, A tendría costes de 5, 11 y 20 € y vendería un único tarro a 8 €. B ofrecería uno más frente a tres pedidos. Que se vendieran tres en ambas ferias observadas no implica que también se vendieran tres en ese escenario."
  },
  {
    "module": 4,
    "id": "final-4",
    "type": "final",
    "case": "En una lonja hay cuatro compradores con máximos de 18, 15, 12 y 8 € por caja, y cuatro vendedores con mínimos de 4, 7, 9 y 14 €. Cada uno intercambia como máximo una caja. El precio común de hoy es 10 €.\n\nCuatro talleres pueden contratar hoy una jornada adicional cada uno. Esa jornada permitirá vender en un año 5,5, 4,4, 3,3 y 2,2 cajas adicionales, respectivamente. El precio de venta esperado es 10 € por caja, el descuento anual es del 10 % y no hay otros costes incrementales. Cuatro trabajadores ofrecen una jornada cada uno por un salario mínimo personal de 19, 27, 36 y 48 €. Un convenio negociado por el sindicato establece un suelo salarial de 42 €. Si sobran candidatos, se contrata primero a quienes tienen menor coste de oportunidad.\n\nEn un escenario alternativo, antes de contratar se conoce un pedido exterior que elevaría el precio esperado a 12 € y el descuento anual subiría al 20 %. La tecnología, las reservas de los trabajadores y el suelo salarial seguirían iguales.",
    "prompt": "¿Qué balance da, en este orden, el excedente conjunto de la lonja hoy, el intervalo completo de salarios que iguala las jornadas ofrecidas y demandadas sin empates antes del suelo, la pérdida de excedente causada por el suelo en el escenario inicial y el empleo con suelo en el escenario alternativo?",
    "options": [
      "25 € de excedente, 27 € < salario < 40 €, 13 € de pérdida y dos jornadas.",
      "25 € de excedente, 30 € < salario < 36 €, 13 € de pérdida y dos jornadas.",
      "15 € de excedente, 30 € < salario < 36 €, 2 € de pérdida y dos jornadas.",
      "25 € de excedente, 30 € < salario < 36 €, 13 € de pérdida y una jornada."
    ],
    "correctIndex": 1,
    "explanation": "En la lonja entran tres parejas. Los compradores ganan 18 + 15 + 12 − 30 = 15 € y los vendedores 30 − (4 + 7 + 9) = 10 €, lo que da un excedente conjunto de 25 €.\n\nLos talleres pueden pagar hoy, como máximo, el ingreso marginal futuro dividido por 1,10. Los cuatro máximos son 50, 40, 30 y 20 €. Se contratan dos jornadas. Entre 30 y 36 € quedan fuera el tercer taller y el tercer trabajador. Usar solo las reservas de los participantes, 27 y 40 €, daría también salarios a los que entraría alguno de los excluidos.\n\nCon un suelo de 42 € solo contrata el primer taller, aunque tres personas quieran trabajar. Dada la regla de adjudicación, se conserva la jornada con valor 50 € y coste 19 €. Se pierde la que valía 40 € y costaba 27 €, de modo que desaparecen 13 € de ganancia conjunta. La diferencia de 2 € entre el suelo y la segunda puja es insuficiente para medir esa pérdida. Con el pedido exterior, cada caja futura vale hoy 12/1,20 = 10 € y los nuevos máximos son 55, 44, 33 y 22 €. Dos talleres cubren los 42 € aun tras el aumento del descuento.\n\nA 42 € mejora el salario de quien mantiene el empleo y desaparece una contratación que beneficiaba a ambas partes. La recuperación de la segunda jornada con el pedido exterior se explica por cuánto vale lo que produce esa jornada. La demanda de trabajo depende tanto de la productividad como del precio del producto y de cuándo se cobra."
  },
  {
    "module": 5,
    "id": "final-5",
    "type": "final",
    "case": "Un mercado parte de 1.000 unidades a 100 € cada una. En ensayos separados, al subir solo el precio propio a 102 €, la cantidad demandada pasa a 970 y la ofrecida a 1.010 a corto plazo o a 1.050 a largo plazo. En otros dos ensayos, al precio propio inicial, encarecer un 5 % un producto rival aumenta un 4 % la demanda del producto estudiado, y elevar un 4 % la renta real la reduce un 2 %.\n\nEn el nuevo escenario, el rival se encarece un 5 %, la renta real cae un 4 % y una mejora logística eleva un 2 % la cantidad ofrecida a cada precio en ambos horizontes. Cada horizonte se compara con el mismo equilibrio inicial. Usa porcentajes sobre las bases iniciales y una aproximación de primer orden que sume los efectos pequeños y mantenga las elasticidades estimadas.",
    "prompt": "¿Qué previsión identifica la relación entre los productos, el tipo de bien y las variaciones del precio y de los ingresos totales por ventas del sector?",
    "options": [
      "Son sustitutos y el bien es inferior. A corto plazo suben el precio un 2 % y los ingresos un 5 %. A largo plazo suben un 1 % y un 5,5 %, respectivamente.",
      "Son sustitutos y el bien es inferior. A corto plazo suben el precio un 3 % y los ingresos un 4,5 %. A largo plazo suben un 1,5 % y un 5,25 %, respectivamente.",
      "Son sustitutos y el bien es inferior. A corto plazo sube el precio un 2 % y caen los ingresos un 1 %. A largo plazo el precio sube un 1 % y los ingresos caen un 0,5 %.",
      "Son sustitutos y el bien es normal. En ambos horizontes el precio se mantiene y los ingresos suben un 2 %, pues la menor renta compensa parte del encarecimiento del rival."
    ],
    "correctIndex": 0,
    "explanation": "La elasticidad precio de la demanda es −3 % / 2 % = −1,5. Las de oferta son 1 % / 2 % = 0,5 y 5 % / 2 % = 2,5. La cruzada es +0,8 (sustitutos) y la de renta −0,5 (bien inferior). En el nuevo escenario, la caída de renta añade un 2 % de demanda al 4 % que aporta el rival. Si p es el cambio porcentual del precio, la demanda varía en 6 − 1,5p y la oferta en 2 + 0,5p a corto plazo o 2 + 2,5p a largo. Al igualarlas, el precio sube un 2 % o un 1 % y la cantidad un 3 % o un 4,5 %, respectivamente. Sumando precio y cantidad se obtienen los dos ingresos. Los precios del 3 % y del 1,5 % omiten la mejora logística. Predecir una caída de ingresos aplica la elasticidad a una curva de demanda que entretanto se desplazó. Tratar el bien como normal invierte el efecto de la renta."
  },
  {
    "module": 6,
    "id": "final-6",
    "type": "final",
    "case": "Una isla importa cereal. Por el encarecimiento previsto de la ruta de abastecimiento, los comerciantes esperan dos mercados distintos. Hoy la demanda para consumo es 130 − 2P y la oferta es 10 + 2P. En la próxima cosecha la demanda será 200 − 2P y la oferta recién llegada será 2P. En cada fecha P es el precio por tonelada en euros y las cantidades son toneladas. Los almacenes compiten entre sí. Retirar hoy una tonelada del consumo y sumarla íntegra a las ventas de la próxima cosecha cuesta 4 €, incluida la financiación. Hay capacidad suficiente y se cumplen las previsiones.\n\nCompara tres escenarios. En el primero hay libertad de precios. En el segundo se anuncia hoy un precio máximo de 36 € solo para la próxima cosecha. En el tercero se añade al máximo futuro un precio mínimo de 36 € hoy. Las normas se cumplen, el Estado no compra excedentes y ningún proveedor produce para desechar lo que no vende.",
    "prompt": "¿Cuánto se almacena en cada escenario y qué desequilibrios aparecen? La oferta sin comprador y la demanda sin atender se miden a los precios legales de la fecha correspondiente.",
    "options": [
      "Sin controles se almacenan 32 t. Con el máximo se almacenan 24 t y faltan 32 t en la cosecha. Al añadir el mínimo aún se almacenan 8 t. Quedan 16 t sin comprador hoy y faltan 48 t en la cosecha.",
      "Sin controles se almacenan 40 t. Con el máximo se almacenan 8 t y faltan 48 t en la cosecha. Al añadir el mínimo aún se almacenan 8 t. Quedan 16 t sin comprador hoy y faltan 48 t en la cosecha.",
      "Sin controles se almacenan 40 t. Con el máximo se almacenan 24 t y faltan 32 t en la cosecha. Al añadir el mínimo cesa el almacenamiento. Quedan 24 t sin comprador hoy y faltan 56 t en la cosecha.",
      "Sin controles se almacenan 32 t. Con el máximo se almacenan 8 t y faltan 48 t en la cosecha. Al añadir el mínimo cesa el almacenamiento. Quedan 24 t sin comprador hoy y faltan 56 t en la cosecha."
    ],
    "correctIndex": 3,
    "explanation": "Al reservar x toneladas, el precio libre actual es 30 + x/4 y el futuro 50 − x/4. Almacenar sigue atrayendo cereal hasta que la diferencia cubre los 4 € de coste. Se almacenan 32 t y los precios son 38 y 42 €. Almacenar 40 igualaría los precios y dejaría sin cubrir ese coste. Con el máximo futuro, el almacén puede pagar hoy hasta 32 €. A ese precio la oferta actual supera en 8 t al consumo. Mañana se demandan 128 t y llegan 72 t nuevas más las 8 t reservadas, de modo que faltan 48 t. La reserva de 24 t supondría pagar 36 € hoy para cobrar los mismos 36 € mañana. Si además rige el mínimo de 36 € hoy, conservar una tonelada ocasiona una pérdida de 4 €, por lo que tampoco persiste la reserva de 8 t. Hoy se ofrecen 82 t y se demandan 58. Mañana solo llegan 72 de las 128 demandadas."
  },
  {
    "module": 7,
    "id": "final-7",
    "type": "final",
    "case": "En un mercado competitivo, el beneficio marginal privado del producto es 112 − Q y su coste marginal privado, 22 + Q. Cada unidad adicional ocasiona a los vecinos un daño marginal de Q por un vertido y aporta a otros fabricantes un conocimiento con beneficio marginal de 15. Ambos efectos quedan fuera del precio. Las magnitudes marginales se expresan en euros por unidad y Q es continua.\n\nPara un periodo se puede dejar actuar al mercado, negociar un acuerdo que alcance la cantidad eficiente con un coste real de 160 €, o aplicar el gravamen por unidad que la alcance con un coste real de 80 €. Recaudar redistribuye poder de compra, sin otros costes. En un segundo escenario independiente, una innovación ya instalada reduce el daño marginal a Q/2. El resto de los datos, incluidos los costes fijos de las dos intervenciones, se mantiene.",
    "prompt": "¿Qué recomendarías en cada escenario para maximizar el excedente social una vez descontados los costes de intervención?",
    "options": [
      "Con el vertido original, gravar 20 € y producir 35 unidades gana 70 € netos. Con la innovación, gravar 6 € y producir 42 unidades gana 11,25 € netos frente al mercado.",
      "Con el vertido original, gravar 20 € y producir 35 unidades gana 70 € netos. Con la innovación, mantener las 45 unidades privadas supera tanto el acuerdo como el gravamen de 6 €.",
      "Con el vertido original, negociar para producir 35 unidades gana 150 € netos y supera el gravamen. Con la innovación, mantener las 45 unidades privadas supera ambas intervenciones.",
      "Con el vertido original, gravar 35 € y producir 27,5 unidades gana más que dejar actuar al mercado. Con la innovación, mantener las 45 unidades privadas supera ambas intervenciones."
    ],
    "correctIndex": 1,
    "explanation": "El mercado elige Q = 45 al igualar 112 − Q y 22 + Q. Con el vertido original, el beneficio social marginal neto es 105 − 3Q y se anula en Q = 35, donde el daño menos el beneficio externo es 35 − 15 = 20 € por unidad. Eliminar las 10 unidades excedentes recupera un triángulo de base 10 y altura 30, por valor de 150 €. El gravamen deja 70 € netos y el acuerdo, −10 €. Gravar todo el daño marginal de 35 € ignora el aprendizaje y reduce Q a 27,5. La producción que se sacrifica por debajo de 35 pierde 84,375 € de excedente, más que los 70 € netos disponibles. Con la innovación, el beneficio social marginal neto es 105 − 2,5Q. La cantidad eficiente sería 42 y el gravamen correctivo, 42/2 − 15 = 6 €. La mejora bruta sobre Q = 45 es solo 3 × 7,5 / 2 = 11,25 €. Ni el gravamen ni la negociación cubren sus costes reales."
  },
  {
    "module": 8,
    "id": "final-8",
    "type": "final",
    "case": "Cuatro fincas comparten un acuífero de libre acceso. Cada extracción adicional deja 42 € de beneficio a quien bombea antes de descontar la caída de presión, que cuesta 12 € a cada una de las cuatro fincas, incluida la que extrae. Una sirena de crecidas, audible por todas sin posibilidad de exclusión, cuesta 48 € y vale 14 € para cada finca. Un servicio distinto de predicción por suscripción cuesta 36 € fijos, puede excluir usuarios y tiene coste marginal cero. Las disposiciones a pagar por la predicción son 18, 14, 10 y 6 €. Cada finca se suscribe si el precio no supera su valoración.\n\nAdemás, reparar un canal generaría un valor de uso total de 85 €, que el operador podría cobrar íntegro. La obra consume 45 € de recursos. Tres titulares tienen vetos independientes, carecen de usos alternativos para el canal y cada uno exige 16 € por autorizar la reparación. Esos pagos serían transferencias. La sirena, la predicción y el canal son proyectos independientes.",
    "prompt": "¿Qué diagnóstico combina el gravamen por extracción igual al daño a terceros, la posibilidad de financiar ambos servicios y el efecto económico de los tres vetos?",
    "options": [
      "Gravar 48 € por extracción. La sirena admite financiación colectiva con ganancia de 8 €. La predicción se autofinancia con una cuota uniforme de 10 €. Los vetos bloquean un canal con excedente social de 40 €.",
      "Gravar 36 € por extracción. La sirena admite financiación colectiva con ganancia de 8 €. La predicción se autofinancia con una cuota uniforme de 10 €. Los vetos impiden un canal cuya apertura destruiría 8 € de excedente social.",
      "Gravar 36 € por extracción. La sirena admite financiación colectiva con ganancia de 8 €. La predicción necesita precios diferenciados u otra fuente de financiación. Los vetos bloquean un canal con excedente social de 40 €.",
      "Gravar 48 € por extracción. La sirena admite financiación colectiva con ganancia de 8 €. La predicción necesita precios diferenciados u otra fuente de financiación. Los vetos impiden un canal cuya apertura destruiría 8 € de excedente social."
    ],
    "correctIndex": 2,
    "explanation": "Quien bombea soporta ya 12 € de daño propio. Los otros tres pierden 36 € en total. Ese es el gravamen correctivo. Extraer deja 30 € privados y destruye 6 € sociales. La sirena es un bien público. Recaudar 12 € por finca cubre su coste y deja 2 € a cada una, aunque cada finca preferiría que pagasen las demás. El pronóstico es un bien de club. Las mejores recaudaciones a precios de 18, 14, 10 y 6 € son 18, 28, 30 y 24 €. Ninguna cubre los 36 €. Con precios diferenciados podrían recaudarse hasta 48 €. En el canal, la suma de exigencias por los vetos deja al operador 85 − 45 − 48 = −8 €. El uso sacrificaría solo 45 € de recursos, de modo que el excedente social sería 40 €. La fragmentación de los permisos deja ociosa una obra valiosa, mientras que el acceso abierto al acuífero induce el problema opuesto."
  },
  {
    "module": 9,
    "id": "final-9",
    "type": "final",
    "case": "Un ayuntamiento quiere aliviar la congestión del puerto. La concesión exclusiva E deja un excedente social adicional de 62 millones hoy y 35 dentro de un año. La licitación abierta L deja 20 hoy y 80 dentro de un año. Un millón futuro vale 0,8 millones hoy. Las cifras ya descuentan los costes reales salvo un posible perjuicio actual de E por desviar tráfico a otros barrios. Ese perjuicio vale 0 o 20 millones con igual probabilidad. Antes de adjudicar el contrato se puede pagar una auditoría independiente de 2 millones que revela cuál de los dos valores es el verdadero. El pleno quiere maximizar el excedente social esperado.\n\nEl alcalde afronta elecciones este año. Las concesionarias instaladas han redactado la cláusula que impide concursar a nuevos operadores. El presupuesto de la oficina que promueve E depende de la recaudación que pueda justificar. Esa oficina solo registra las rutas que permanecen en el puerto. También pronostica más ingresos al subir el peaje de 2 a 3 € por viaje, aunque los viajes que lo pagan caerían de 10 a 6 millones. El peaje es una transferencia interna y los efectos reales del cambio de tráfico ya están recogidos en las cifras anteriores.",
    "prompt": "¿Qué recomendarías al pleno antes de adjudicar el contrato, y qué peso darías a las previsiones y a los registros de la oficina?",
    "options": [
      "Adjudicar L sin auditar. El control cuesta 2 millones y solo puede mejorar en 1 millón la decisión antes de pagar por él. La recaudación caería en 2 millones y la oficina omite rutas relevantes.",
      "Auditar y escoger E si el perjuicio es cero o L si es 20. La auditoría aporta 3 millones netos y el peaje recaudaría 2 millones menos. La cláusula de acceso puede favorecer a las concesionarias.",
      "Auditar y escoger E si el perjuicio es cero o L si es 20. La auditoría aporta 1 millón neto y el peaje recaudaría 10 millones más. La oficina puede medir el perjuicio siguiendo solo las rutas que permanecen.",
      "Auditar y escoger E si el perjuicio es cero o L si es 20. La auditoría aporta 1 millón neto y el peaje recaudaría 2 millones menos. La muestra de la oficina deja fuera a quienes sufren el desvío."
    ],
    "correctIndex": 3,
    "explanation": "L vale 20 + 0,8 × 80 = 84 millones. E vale 62 + 0,8 × 35 = 90 si el desvío es inocuo y 70 en el otro estado. Sin auditoría se elegiría L, pues E vale 80 en promedio. Con información se elige E en el primer estado y L en el segundo. El valor esperado sube a (90 + 84)/2 = 87 antes de pagar y a 85 después. La información aporta 3 millones brutos y 1 neto. El peaje pasaría de 2 × 10 = 20 a 3 × 6 = 18 millones. Aplicar el nuevo precio al tráfico antiguo infla la previsión.\n\nE concentra beneficios antes de las elecciones y la cláusula de acceso protege a los operadores instalados. Vincular el presupuesto de la oficina a la recaudación prevista también le da un incentivo para sobrestimarla. Son incentivos distintos del problema de información que crea la oficina al omitir rutas. Conocer los ingresos tampoco permite ordenar por sí solo las prioridades de los barrios. Aquí la decisión queda determinada porque el pleno fijó de antemano su criterio de excedente."
  },
  {
    "module": 10,
    "id": "final-10",
    "type": "final",
    "case": "Una ciudad debe escoger cómo prestar un servicio. A es una concesión exclusiva, B una licitación abierta y C la gestión municipal. Tres bloques, que representan el 41 %, 34 % y 25 % de los votos, ordenan las alternativas A > C > B, B > A > C y C > B > A, respectivamente. En cada ronda votan sinceramente entre dos propuestas. La ganadora de la primera ronda se enfrenta a la que quedó fuera.\n\nUna asociación de 15 empresas obtendría 40.000 € por empresa si gana A y cero en los demás casos. Una campaña conjunta de 45.000 € aumentaría en diez puntos porcentuales la probabilidad de que se adopte el orden de rondas favorable a A. Para un elector, estudiar una auditoría cuesta 2 €, su probabilidad de ser decisivo es 1 entre 10.000 y acertar en un voto decisivo le reportaría 80 €. Algunos electores que sí han entendido la auditoría siguen creyendo que toda compra al extranjero empobrece a la ciudad, incluso cuando conocen la ganancia demostrada en este contrato. El alcalde señala además que las ciudades con más prensa independiente suelen tener mayor renta.",
    "prompt": "¿Qué estrategia y qué interpretación de la conducta de empresas y votantes se sostienen con estos datos?",
    "options": [
      "Abrir con B frente a C y financiar la campaña, con una ganancia esperada adicional de 15.000 € para la asociación. Es racional ahorrar el coste de informarse y, entre quienes sí leyeron, puede persistir el sesgo antiextranjero. La comparación de ciudades solo establece una asociación.",
      "Abrir con C frente a A y financiar la campaña, con una ganancia esperada adicional de 15.000 € para la asociación. Para el elector compensa estudiar porque acertar vale 80 €. La comparación de ciudades solo establece una asociación.",
      "Abrir con B frente a C y descartar la campaña, pues los 4.000 € esperados por empresa quedan por debajo de los 45.000 € del anuncio. Es racional ahorrar el coste de informarse. La mayor renta identifica el efecto propio de la prensa.",
      "Abrir con A frente a B y descartar la campaña, pues A es favorita del bloque más numeroso. Tanto omitir la auditoría como desatenderla después de entenderla son casos de ignorancia racional. La comparación de ciudades solo establece una asociación."
    ],
    "correctIndex": 0,
    "explanation": "C vence a B por 66 a 34, A vence a C por 75 a 25 y B vence a A por 59 a 41. Para que A gane, la primera ronda debe eliminar a B. El 41 % de primeras preferencias de A no la protege en un duelo con B. Como cualquier otro orden derrota a A, la campaña aporta 0,10 × 15 × 40.000 − 45.000 = 15.000 € esperados al grupo. Cobrar la campaña entera a cada empresa cambia indebidamente el cálculo.\n\nPara el votante, el valor esperado de informarse es como máximo 80/10.000 = 0,008 €, menos de los 2 € que cuesta. En cambio, mantener una creencia antiextranjera después de comprender la evidencia ilustra la irracionalidad racional si equivocarse tiene un coste privado ínfimo. Una prensa independiente podría facilitar el control del poder, pero la comparación de rentas no aísla su efecto del de otras instituciones."
  },
  {
    "module": 11,
    "id": "final-11",
    "type": "final",
    "case": "Una economía pequeña puede importar lentejas a 20 € por saco. Su demanda interior es Qd = 140 − 2Pc y su oferta interior es Qs = 10 + Pv. Las cantidades se miden en miles de sacos y Pc y Pv son, respectivamente, el precio pagado por el consumidor y el que recibe el productor nacional. Hay competencia, libre importación al precio mundial y ningún efecto externo. Los fondos públicos se valoran euro por euro, sin costes adicionales de administración o financiación.\n\nLa política T aplica un arancel de 6 € por saco importado. La política P lo sustituye por un impuesto de 6 € sobre cada saco consumido, cualquiera que sea su origen, y una ayuda de 6 € por saco producido en el país. Son los comercios quienes ingresan el impuesto. Una enmienda a P propone eliminar solo el impuesto al consumo y mantener íntegra la ayuda.",
    "prompt": "Comparando cada política con el libre comercio sin intervención, ¿qué balance es correcto? Las cifras monetarias de las opciones son miles de euros.",
    "options": [
      "T y P dejan 52.000 sacos importados y una pérdida social de 54. T recauda 312 y P recauda 528 netos. Con la enmienda se importarían 64.000 sacos, el gasto público sería 216 y la pérdida social sería 18.",
      "T y P dejan 52.000 sacos importados, un ingreso público neto de 312 y una pérdida social de 54. Con la enmienda se importarían 64.000 sacos, el gasto público sería 216 y la pérdida social sería 36.",
      "T y P dejan 52.000 sacos importados, un ingreso público neto de 312 y una pérdida social de 54. Con la enmienda se importarían 64.000 sacos, el gasto público sería 216 y la pérdida social sería 18.",
      "T deja 52.000 sacos importados y recauda 312. En P el impuesto y la ayuda se compensan, de modo que se mantienen el consumo y la producción de libre comercio. Con la enmienda se importarían 64.000 sacos y la pérdida social sería 18."
    ],
    "correctIndex": 2,
    "explanation": "Con libre comercio, a 20 € se consumen 100.000 sacos y se producen 30.000. Con T el precio interior sube a 26 € y quedan 88.000 consumidos, 36.000 producidos y 52.000 importados. T recauda 6 × 52 = 312 miles de euros. En P el precio mundial sigue disponible antes de impuestos. El comprador paga 26 € y el productor nacional obtiene 20 + 6 = 26 €. Que el comercio ingrese el impuesto no cambia esos precios. P cobra 6 × 88 = 528 y paga 6 × 36 = 216, con el mismo saldo de 312 que T.\n\nLas dos políticas pierden ½ × 6 × (36 − 30) = 18 por producción nacional de coste excesivo y ½ × 6 × (100 − 88) = 36 por compras que dejan de hacerse. Con la enmienda el consumidor vuelve a pagar 20 €, el productor sigue recibiendo 26 € y las importaciones son 100 − 36 = 64 miles de sacos. Se siguen pagando 216 de subsidio, pero solo queda la pérdida productiva de 18. El desembolso del Estado y la pérdida de excedente miden cosas distintas."
  }
];
