export const registeredWorklets = new Map()

// Esta função cria um URL de objeto a partir de uma string de código de um AudioWorklet.
// AudioWorklets precisam ser carregados a partir de um URL, e esta é uma maneira de criá-los
// dinamicamente no lado do cliente sem a necessidade de um arquivo .js separado no servidor.
export const createWorketFromSrc = (workletName, workletSrc) => {
  // Cria um Blob (Binary Large Object), que é um objeto semelhante a um arquivo, imutável e com dados brutos.
  const script = new Blob(
    // O conteúdo do Blob é uma string de código JavaScript.
    // `registerProcessor` é a função global dentro de um escopo de worklet para registrar uma nova classe de processador de áudio.
    // A variável `workletSrc` (que é uma string contendo a definição da classe do worklet) é injetada aqui.
    [`registerProcessor("${workletName}", ${workletSrc})`],
    {
      type: "application/javascript", // Define o tipo MIME do conteúdo.
    }
  )

  // URL.createObjectURL cria uma string de URL única que aponta para o objeto Blob na memória do navegador.
  // Este URL pode então ser usado para carregar o worklet no AudioContext.
  return URL.createObjectURL(script)
}
