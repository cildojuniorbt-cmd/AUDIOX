# AUDIOX STEMS

## Objetivo

Adicionar ao fluxo do Downloader uma operação integrada de separação de música por IA. A pessoa informa uma fonte autorizada, escolhe a operação e recebe os stems sem precisar salvar o arquivo numa pasta e importá-lo manualmente no Conversor.

## Experiência planejada

1. A pessoa escolhe **Baixar áudio**, **Baixar vídeo** ou **Baixar + separar Stems**.
2. Para separação, seleciona o formato final: **WAV** ou **MP3**.
3. O AUDIOX obtém a mídia por uma fonte autorizada e a mantém numa área temporária interna.
4. O motor de separação processa o áudio e gera os stems.
5. O usuário pode baixar cada stem individualmente ou todos em um ZIP.
6. Os arquivos temporários intermediários são removidos ao final, inclusive em caso de falha ou cancelamento, sempre que o processo permitir.

## Primeiro conjunto de stems

O primeiro perfil será o modelo de quatro saídas:

- Vocais
- Bateria
- Baixo
- Outros instrumentos

Modelos de seis stems ou separações especializadas (guitarra, piano, instrumentos isolados) ficam para uma etapa posterior, após avaliação de qualidade. Não prometer isolamento perfeito: vazamento entre instrumentos e artefatos são limitações inerentes aos modelos.

## Formatos de saída

- **WAV:** saída sem compressão com perdas, indicada para edição e mixagem; ocupa mais espaço.
- **MP3:** saída comprimida, indicada para arquivos menores e compartilhamento. A taxa de bits será configurável.

A conversão para WAV não recupera informação que já tenha sido perdida numa fonte MP3 ou em outro formato com perdas.

## Arquitetura por plataforma

### Desktop Windows

Prioridade para o primeiro motor local. O app desktop deverá chamar um processo auxiliar (sidecar) isolado, com diretórios temporários próprios, progresso, cancelamento e mensagens de erro estruturadas. A detecção de GPU deve ser explícita e permitir fallback para CPU. A configuração do usuário inclui um PC com RTX 3060 12 GB, mas o produto não deve presumir que todo usuário tenha GPU NVIDIA.

### Desktop macOS

O motor será validado separadamente em Apple Silicon. Não assumir que o mesmo pacote CUDA do Windows funcione no Mac. Avaliar backend compatível com Metal/MLX ou execução CPU antes de anunciar aceleração.

### Web/PWA e iPhone

O FFmpeg.wasm atual não é um motor de separação por IA e não deve ser apresentado como tal. O navegador e o iPhone não receberão um modelo pesado automaticamente. A experiência PWA só poderá oferecer Stems depois de existir um serviço remoto explícito, com consentimento antes do envio, limites de tamanho/duração, política de retenção e estimativa de custo. Não enviar mídia para nuvem silenciosamente.

## Avaliação técnica do motor

- Demucs/HTDemucs oferece um ponto de partida conhecido para quatro stems e suporte documentado a WAV e MP3. O projeto original informa que o desenvolvimento está em ritmo reduzido, portanto deve ser encapsulado atrás de uma interface substituível.
- BS-RoFormer e variantes recentes devem ser avaliados em testes comparativos, mas o uso de cada checkpoint depende de licença explícita dos pesos, não apenas da licença do código. Não distribuir pesos com termos ausentes ou ambíguos.
- A decisão final de modelo deve considerar qualidade auditiva, artefatos, consumo de VRAM/RAM, tempo de processamento, tamanho do download, compatibilidade Windows/macOS e direitos de redistribuição.

## Contrato funcional do motor

A implementação deve fornecer:

- checkAvailability: informa se o motor está instalado e pronto, dispositivo de execução e modelo disponível.
- separate: recebe arquivo local, modelo/perfil e formato WAV/MP3; retorna identificador do trabalho.
- progress: progresso por etapas sem inventar porcentagens quando o motor não as fornece.
- cancel: solicita cancelamento seguro.
- collectOutputs: retorna os quatro stems e metadados de formato/tamanho.
- cleanup: remove arquivos temporários e resultados intermediários após exportação, falha ou cancelamento.

A interface não deve oferecer ação ativa de separação enquanto o motor não estiver disponível. Falhas de GPU devem ser reportadas e oferecer fallback de CPU quando viável.

## Segurança, privacidade e fontes

- Aceitar somente arquivos locais ou fontes cujo download seja permitido pelo provedor e autorizado pelo usuário.
- Não contornar DRM, autenticação, paywall, bloqueios técnicos ou termos de plataformas.
- Não enviar arquivos a serviços de terceiros sem consentimento claro.
- Não manter arquivos temporários após o prazo operacional necessário.
- Validar extensão, MIME, tamanho e duração antes de iniciar o processamento.
- Não executar comandos de shell montados a partir de nomes de arquivos fornecidos pelo usuário; usar argumentos separados e caminhos temporários gerados pelo app.

## Critérios de aceite do MVP

- Separar uma faixa estéreo de teste em quatro stems.
- Testar WAV e MP3, incluindo taxas de bits.
- Comparar qualidade de saída por audição e conferir duração, canais e sample rate.
- Testar Windows com GPU NVIDIA e fallback CPU.
- Medir VRAM, RAM, tempo e tamanho dos arquivos.
- Cancelar no meio e confirmar limpeza temporária.
- Testar nomes com espaços, acentos e caracteres especiais.
- Confirmar que os arquivos aparecem na Biblioteca e podem ser baixados individualmente ou em ZIP.
- Só então habilitar o fluxo de Stems no Downloader.

## Etapas

1. Especificação e seleção responsável do motor. **Concluída**
2. Sidecar local para Windows, diagnóstico e testes de modelo.
3. Integração com a interface Downloader e exportação WAV/MP3.
4. Validação em macOS Apple Silicon.
5. Avaliação de serviço remoto para PWA/iPhone, somente se houver orçamento e consentimento.
