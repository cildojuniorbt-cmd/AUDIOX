# AUDIOX STEMS — plano de entrega mobile-first

Data: 2026-11-23

## Ordem de prioridade aprovada

1. PWA/navegador no iPhone (Safari e instalação na Tela de Início).
2. Android (Chrome/PWA e, quando necessário, runtime nativo).
3. Windows e macOS somente depois da validação mobile.

O objetivo é processamento local/offline, sem enviar áudio para servidores e sem créditos por separação.

## Estratégia técnica

### Primeira implementação: motor compartilhado no navegador

Usar ONNX Runtime Web em Web Worker, com um modelo Demucs HT Demucs de quatro saídas: vocals, drums, bass e other.

A execução escolhe o melhor backend realmente disponível:
- WebGPU quando suportado e estável.
- WebAssembly CPU como fallback universal.

**Atenção ao iPhone:** a matriz oficial do ONNX Runtime Web lista WASM/CPU para Safari iOS, mas não WebGPU. Portanto, a PWA no iPhone poderá executar localmente em CPU, mas será mais lenta e sujeita aos limites de memória/tempo do Safari. Não anunciar aceleração GPU no iPhone via navegador.

Android Chrome pode usar WebGPU em dispositivos compatíveis; caso contrário usa WASM CPU. O perfil será selecionado por capacidade real, não apenas pelo nome do aparelho.

### Modelo inicial

HT Demucs 4-stem, formato ONNX compacto (FP16) como primeira opção, com alternativa FP32 se o runtime/dispositivo não suportar o formato compacto. O modelo será baixado sob demanda, com tamanho estimado e espaço livre exibidos antes do download, progresso e cancelamento, cache local persistente quando permitido, verificação de integridade, reutilização offline após o primeiro download e opção para remover o modelo e liberar espaço.

A licença MIT do repositório Demucs cobre o código e os pesos distribuídos pelo projeto original conforme sua licença. Para qualquer conversão ONNX de terceiros, validar também a licença e proveniência específicas do arquivo convertido antes de hospedá-lo ou redistribuí-lo. Preferir conversões com licença MIT explícita e preservar os avisos de atribuição.

### Regras específicas para iPhone/PWA

- Processamento em primeiro plano; orientar o usuário a manter AUDIOX aberto e a tela ativa durante a separação.
- Não prometer processamento contínuo se o Safari suspender a aba ou encerrar o processo por memória.
- Começar com faixa curta de teste e perfil econômico.
- Dividir áudio em segmentos, limitar buffers e liberar tensores/memória entre segmentos.
- Guardar o modelo em Cache Storage/IndexedDB/OPFS quando suportado; detectar quota e falhas de persistência.
- Se o navegador não tiver memória suficiente, informar claramente e não iniciar o job.
- Não prometer que o iPhone permitirá processamento em background.

### Regras específicas para Android/PWA

- Preferir WebGPU quando adapter e modelo forem compatíveis.
- Fallback para WASM CPU.
- Usar SharedArrayBuffer e múltiplas threads apenas quando cross-origin isolation estiver realmente habilitada.
- Detectar armazenamento e RAM aproximada; nunca confiar somente em navigator.deviceMemory.
- Manter a tela ativa durante processamento quando a API Screen Wake Lock estiver disponível, sem depender dela.

### Biblioteca e Downloader

- Usar o mesmo registro de arquivos já existente na Biblioteca do AUDIOX.
- Adicionar ação Separar instrumentos nos arquivos de áudio compatíveis.
- O arquivo local será lido diretamente; não baixar nem duplicar novamente.
- Após separar, salvar quatro saídas como novos itens da Biblioteca, com vínculo ao arquivo de origem.
- O fluxo Baixar + separar só será habilitado depois que o motor local estiver pronto. Download de mídia e separação permanecem etapas distintas, e somente fontes de download autorizadas serão integradas.

## Segunda implementação: runtime nativo móvel

Se a PWA não oferecer desempenho/estabilidade aceitável em iPhone ou Android, manter a mesma interface e criar invólucro nativo com Capacitor ou migração seletiva de telas:
- iOS: Core ML / Accelerate.
- Android: ExecuTorch / Vulkan ou ONNX Runtime Mobile.
- Os arquivos e modelos permanecem locais.
- Não incluir Windows/macOS nesta etapa.

Um projeto de referência público demonstra Demucs 4-stem em Android e iOS usando runtimes móveis, com modelos GPU específicos para Core ML/Vulkan e fallback ONNX CPU. Isso é evidência de viabilidade técnica, não garantia de que os binários/modelos possam ser copiados sem revisão de licença e compatibilidade.

## Limitações que devem ser comunicadas honestamente

- No iPhone pelo Safari/PWA, a execução tende a ser CPU-only no ONNX Runtime Web e pode levar vários minutos; a aba pode ser encerrada por pressão de memória ou ao ir para segundo plano.
- Android varia muito por fabricante, GPU, RAM e versão do navegador.
- O primeiro uso exige baixar o modelo (centenas de MB, conforme a variante); depois pode funcionar offline se o navegador mantiver o cache.
- A qualidade é a do modelo; vazamento entre instrumentos e artefatos são esperados.
- Não existe garantia de tempo fixo nem de compatibilidade com todo aparelho.

## Critérios de aceite mobile

### iPhone Safari/PWA
- Instalar AUDIOX na Tela de Início e baixar o modelo.
- Fechar/reabrir e confirmar que o modelo continua disponível offline.
- Separar faixa de teste em 4 stems sem tráfego de áudio para servidor.
- Reproduzir/exportar os quatro resultados.
- Testar cancelamento, pouco espaço, memória insuficiente e retorno do Safari após suspensão.
- Confirmar que o usuário recebe aviso para manter o app em primeiro plano.

### Android Chrome/PWA
- Testar WebGPU e fallback WASM.
- Confirmar uso de threads somente com isolamento cross-origin.
- Baixar/cachear modelo, separar offline e exportar.
- Testar aparelhos de memória baixa e média.

### Privacidade
- A inferência não faz requisições de rede com o áudio.
- Requisições de rede permitidas apenas para baixar o modelo e atualizações do app.
- Mostrar indicação explícita de Processamento local durante a separação.

## Desktop

Windows e macOS ficam deliberadamente adiados até a entrega e validação de iPhone, Android e PWA. O desenho do contrato comum deve permitir conectar os motores desktop depois sem refazer a interface.