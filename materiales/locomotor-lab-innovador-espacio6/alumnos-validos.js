window.ESPACIO6_STUDENTS={"6B-K7P4": "Antón Resa, Mateo", "6B-M2R8": "Arribas Herranz, Neila", "6B-T9C3": "Barquín López, María", "6B-P5X1": "Benito Camarero, Eric", "6B-H8N6": "Caballero García, Julia", "6B-V3L7": "Calderón Ambrosio, Sofía", "6B-R6Q2": "Calzada Ruiz, Mireia", "6B-D4W9": "Casares Fresno, Carla", "6B-N7F5": "Cob Valenciano, Héctor", "6B-B9K2": "Gimeno López, Daniela", "6B-X4M8": "González Martínez, Sara", "6B-C6T1": "Güemes Cámara, Mario", "6B-J8V3": "Izquierdo Fernández, Rodrigo", "6B-F2R7": "Jiménez Alonso, Noa", "6B-Q5H9": "Jorge Alonso, Alba", "6B-L3X6": "Losantos García, Valeria", "6B-S7D4": "Merino Serrano, Vega", "6B-G9P1": "Moreno Cortés, Raúl", "6B-W2N8": "Nava Durán, Miguel Ángel", "6B-E6K5": "Olalla Revilla, Mateo", "6B-U4C7": "Pascual Quintanilla, Himilce", "6B-A8Q3": "Ruiz Barriuso, Jimena", "6B-Z5R2": "Sainz López, Saúl", "6B-Y7M4": "Santamaría García, Martín", "6B-I3V9": "Vicario González, Enrique"};
window.ESPACIO6_TEST_CODES=new Set(["TEST-001"]);
window.ESPACIO6_normalizeCode=v=>String(v||"").trim().toUpperCase().replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g,"-").replace(/\s+/g,"");
window.ESPACIO6_validateStudent=function(rawCode,group){
 const code=window.ESPACIO6_normalizeCode(rawCode);
 if(window.ESPACIO6_TEST_CODES.has(code))return {ok:true,code,group,test:true};
 if(!window.ESPACIO6_STUDENTS[code])return {ok:false,error:"Código no válido. Revisa tu código personal."};
 const expected=code.startsWith("6B-")?"6.º B":"6.º A";
 if(!group)return {ok:false,error:"Selecciona tu grupo."};
 if(group!==expected)return {ok:false,error:"El código no corresponde al grupo seleccionado."};
 return {ok:true,code,group};
};