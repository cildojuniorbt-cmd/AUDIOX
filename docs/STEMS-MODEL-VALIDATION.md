# AUDIOX STEMS — validação do modelo candidato

Data: 2026-11-23

## Modelo candidato para a primeira prova de conceito

- Repositório: `StemSplitio/htdemucs-onnx`
- Arquivo: `htdemucs_fp16weights.onnx`
- URL: `https://huggingface.co/StemSplitio/htdemucs-onnx/resolve/main/htdemucs_fp16weights.onnx`
- Tamanho publicado: aproximadamente 166 MB
- SHA-256 publicado pelo Hugging Face: `d05c269d0178d2a72ad484b10b11dd370193fc923201c3b27a99f848745db70a`
- Licença declarada no repositório do modelo: MIT
- Entradas: `mix`, tensor float32 com shape `[1, 2, 343980]`
- Saída: `stems`, tensor float32 com shape `[1, 4, 2, 343980]`
- Ordem das saídas: drums, bass, other, vocals
- Taxa de amostragem: 44.1 kHz, estéreo, blocos de 7.8 segundos.

## Risco crítico para celular

O tamanho de download não representa o consumo de RAM durante a inferência. O cartão do modelo reporta cerca de 1.1 GB de RAM para um segmento de 7.8 segundos, mesmo para a variante com pesos FP16. O FP16 reduz o download, mas não reduz de forma equivalente a memória de inferência, pois a execução recebe e produz tensores float32.

Portanto:
- Não habilitar separação automaticamente em iPhone apenas porque WebAssembly está disponível.
- Não considerar `navigator.deviceMemory` como medição confiável de RAM livre.
- Não executar um teste longo antes de medir o custo de criação da sessão e o pico de memória em aparelhos reais.
- Usar faixa curta, processamento em primeiro plano e cancelamento.
- Se o iPhone encerrar a PWA ou falhar ao criar a sessão, não insistir em retentativas que possam encerrar a aba novamente.
- Avaliar runtime nativo com Core ML como caminho de produto para iPhone se a PWA não couber no orçamento de memória.
- Android deve ser testado em GPU e CPU separadamente; compatibilidade WebGPU não garante que o modelo caiba na memória da GPU.

## Critério para ativar o botão

O botão de separação só deve ficar habilitado quando:
1. O modelo tiver sido baixado e sua integridade SHA-256 validada.
2. O ONNX Runtime Web conseguir criar a sessão no backend escolhido.
3. Uma faixa curta gerar os quatro tensores sem erro.
4. Os quatro WAVs puderem ser exportados e reproduzidos.
5. O teste confirmar que o áudio do usuário não é enviado para qualquer endpoint.

Até que esses critérios sejam comprovados, a interface deve identificar o recurso como em preparação e nunca apresentar uma separação simulada.

## Referências

- Model card e especificações: https://huggingface.co/StemSplitio/htdemucs-onnx
- Arquivo e hash SHA-256: https://huggingface.co/StemSplitio/htdemucs-onnx/blob/main/htdemucs_fp16weights.onnx
- Código de inferência e documentação do exportador: https://github.com/StemSplit/demucs-onnx
- Trabalho original HT-Demucs: https://github.com/facebookresearch/demucs

A licença MIT e a proveniência declaradas devem ser preservadas com os avisos de atribuição. Não copiar código de terceiros para o AUDIOX sem registrar os arquivos de origem e suas licenças.
