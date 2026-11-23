# AUDIOX STEMS — decisão técnica inicial

Data: 2026-11-23

## Decisão de produto

O AUDIOX Stems será local-first: a separação deve acontecer no próprio dispositivo, sem enviar áudio a servidores e sem créditos por faixa. A nuvem não será requisito do produto.

A mesma experiência visual será compartilhada, mas cada plataforma poderá usar um runtime nativo adequado ao seu hardware.

## Fluxo de arquivos

1. O Downloader recebe apenas fontes e arquivos cujo download seja autorizado.
2. O arquivo original é salvo na Biblioteca local do AUDIOX.
3. A ação "Separar instrumentos" abre esse mesmo arquivo no Stems, sem novo download nem cópia desnecessária.
4. O motor lê o arquivo local, decodifica para PCM e gera Vocais, Bateria, Baixo e Outros.
5. Os quatro resultados são salvos na Biblioteca e podem ser reproduzidos ou exportados individualmente ou em ZIP.
6. Arquivos temporários e intermediários são removidos após conclusão, falha ou cancelamento, sempre que tecnicamente possível.

## Arquitetura por plataforma

### Windows

Primeiro alvo de implementação e validação. O shell Tauri chama um processo local isolado (sidecar), com protocolo estruturado para disponibilidade, diagnóstico, início, progresso, cancelamento, coleta dos resultados e limpeza. GPU NVIDIA/CUDA será uma aceleração opcional; CPU deve ser considerada como fallback, sem presumir GPU no computador do usuário.

### macOS

Runtime separado para Apple Silicon. Avaliar Core ML / Metal ou outro backend compatível. Não reutilizar binários CUDA do Windows nem prometer aceleração antes dos testes em Apple Silicon.

### Android

Motor nativo ou runtime móvel com aceleração NNAPI/GPU quando disponível. O aplicativo deve escolher um perfil conforme memória e recursos detectados e manter fallback compatível. O modelo deve ser baixado uma vez e ficar disponível offline.

### iOS

Motor nativo ou runtime compatível com Core ML / Neural Engine. O modelo deve ser instalado/baixado uma vez e usado offline. Respeitar limites de memória, temperatura, bateria e execução em segundo plano do iOS.

### Web/PWA

A PWA continuará oferecendo conversão local com FFmpeg.wasm. FFmpeg.wasm não é um motor de separação por IA. Não apresentar Stems como funcional na PWA até existir um runtime local de navegador realmente validado. Não enviar arquivos à nuvem silenciosamente.

## Contrato comum do motor

A interface TypeScript deve depender de um contrato independente de plataforma:

- `checkAvailability()`: pronto/não pronto, versão do motor, modelo instalado, dispositivo/backend e requisitos.
- `getProfiles()`: perfis de qualidade disponíveis neste dispositivo.
- `installModel(profile, onProgress)`: baixar/instalar modelo com consentimento e progresso; validar hash e espaço.
- `separate(input, options, onProgress, signal)`: processar arquivo local e retornar metadados dos resultados.
- `cancel(jobId)`: solicitar cancelamento seguro.
- `cleanup(jobId)`: remover temporários e intermediários.

A UI não habilita a separação enquanto o motor/modelo não estiver pronto. Não inventar percentuais: usar progresso real quando fornecido pelo runtime e etapas indeterminadas quando não houver percentual confiável.

## Perfis de desempenho

- Econômico: menor consumo de RAM/VRAM e maior compatibilidade; pode demorar mais.
- Equilibrado: padrão recomendado quando suportado.
- Alta qualidade: maior consumo de memória e tempo; somente em dispositivos compatíveis.

A detecção de capacidade escolhe um perfil recomendado, mas o usuário poderá selecionar outro perfil compatível. Não prometer duração fixa, pois varia por modelo, duração do áudio, CPU/GPU, memória, temperatura e sistema operacional.

## Modelos e licenças

Código e pesos/checkpoints são ativos licenciáveis separadamente. Uma licença MIT do código de um projeto não prova que todos os pesos distribuídos com ele podem ser redistribuídos ou usados comercialmente.

Demucs/HTDemucs é uma referência técnica para benchmark de quatro stems, mas os pesos publicados não serão empacotados nem redistribuídos no AUDIOX até que a proveniência, licença e permissões dos checkpoints estejam documentadas e aprovadas.

Ultimate Vocal Remover (UVR) declara licença MIT para o código e solicita atribuição/crédito em integrações de terceiros. Isso não elimina a necessidade de verificar individualmente a licença e a origem dos modelos/pesos usados.

Antes de selecionar qualquer modelo, registrar:
- repositório e autor;
- URL e hash do checkpoint;
- licença do código;
- licença explícita dos pesos;
- permissão de redistribuição e uso comercial;
- atribuições e avisos exigidos;
- formato e compatibilidade de runtime;
- tamanho, RAM/VRAM e qualidade auditiva.

Se não houver permissão clara, não incluir esse checkpoint no instalador nem no download de modelos do AUDIOX.

## Segurança e experiência

- Processamento local por padrão; nunca transmitir áudio sem consentimento claro.
- Validar tipo, tamanho, duração e integridade dos arquivos.
- Usar caminhos temporários gerados pelo app; nunca montar comandos de shell com nomes de arquivo do usuário.
- Mostrar espaço necessário antes de baixar um modelo.
- Avisar sobre uso de bateria, aquecimento e memória em dispositivos móveis.
- Permitir que o usuário escolha onde salvar resultados e limpar resultados/temporários.
- O arquivo baixado permanece no dispositivo e pode ser separado offline, desde que o modelo esteja instalado.

## Sequência de implementação

1. Fechar a matriz de modelos e licenças (código e pesos separadamente).
2. Definir e implementar o contrato comum TypeScript e o adaptador Tauri.
3. Criar o sidecar Windows, diagnóstico de hardware e primeiro benchmark local.
4. Validar quatro stems em WAV/MP3, qualidade, progresso, cancelamento, limpeza e exportação.
5. Integrar o fluxo Biblioteca → Stems e Downloader → Stems usando o arquivo já salvo.
6. Criar e validar runtime macOS Apple Silicon.
7. Criar runtimes Android e iOS, com perfis adaptativos.
8. Reavaliar PWA apenas se houver runtime local de navegador viável.

## Critérios de aceite do primeiro motor

- Separar uma faixa estéreo autorizada em quatro stems.
- Conferir duração, canais, sample rate e reprodução dos quatro resultados.
- Medir tempo, RAM e VRAM em hardware de referência.
- Testar CPU e GPU quando disponíveis.
- Testar arquivos longos, nomes com acentos/espaços, falta de espaço, cancelamento e falhas.
- Confirmar que nenhuma mídia é transmitida pela rede durante a separação.
- Confirmar que os quatro resultados entram na Biblioteca e podem ser exportados.
