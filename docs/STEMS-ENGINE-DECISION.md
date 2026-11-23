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

## Arquitetura por plataforma e prioridade de entrega

A prioridade de produto é **iPhone/PWA → Android/PWA → runtimes desktop**. Esta ordem substitui a prioridade desktop descrita em versões anteriores deste documento.

### iPhone Safari/PWA (primeiro alvo)

Avaliar ONNX Runtime Web em Web Worker, com WASM/CPU como backend esperado. Não anunciar WebGPU no Safari iOS. Processar em primeiro plano, em segmentos e com limites explícitos de memória; a aba pode ser suspensa ou encerrada pelo sistema. Não prometer execução em segundo plano.

### Android Chrome/PWA

Usar ONNX Runtime Web em Web Worker. Preferir WebGPU somente após confirmar adapter, operadores e modelo compatíveis; manter WASM/CPU como fallback. Ativar WASM multithread apenas quando cross-origin isolation e SharedArrayBuffer estiverem realmente disponíveis.

### Windows e macOS

Ficam para uma etapa posterior à validação móvel. Avaliar runtimes nativos/sidecars adequados a cada sistema, sem presumir que CUDA do Windows seja reutilizável no macOS. CPU deve continuar sendo uma alternativa quando viável.

### Protótipo técnico isolado

Existe um laboratório independente em `prototype/stems-browser/`. Ele testa SCNet INT8 com `@audio/neural-separate` e ONNX Runtime Web em Web Worker, usando WASM/CPU, com limite inicial de 8 segundos. As dependências ficam em um `package.json` próprio e não são adicionadas ao app principal. O protótipo não inclui nem hospeda pesos no repositório; o runtime obtém o modelo sob demanda e pode mantê-lo no cache do navegador. O objetivo é validar compatibilidade, responsividade, memória e qualidade em Safari iOS e Chrome Android. O teste não aprova o modelo para uso comercial e não habilita Stems na PWA pública.

### Limite atual da implementação

A PWA atual ainda não executa separação por IA. `stems-capabilities.ts` apenas detecta recursos do navegador; isso não comprova que um modelo esteja instalado ou que seus operadores sejam executáveis. `stems.ts` atualmente conversa com um serviço externo local em `127.0.0.1:8420`, não com um Web Worker ONNX. A ação de separação na PWA deve permanecer desativada até que o runtime, modelo, persistência e testes estejam completos. FFmpeg.wasm faz conversão/decodificação, não separação por IA.

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

Código, pesos/checkpoints e dados de treinamento são camadas de direitos distintas. Uma licença MIT do código ou de uma exportação ONNX não prova, por si só, que os pesos e os dados de treinamento estão liberados para uso comercial e redistribuição.

A pesquisa preliminar está registrada em [`docs/STEMS-MODEL-RESEARCH.md`](./STEMS-MODEL-RESEARCH.md). Resultado atual: HTDemucs não está aprovado para distribuição comercial; Open-Unmix UMX-HQ é apenas candidato a protótipo técnico controlado, pois foi treinado com MUSDB18-HQ, cujos termos oficiais restringem o uso comercial sem autorização dos titulares. Nenhum modelo está liberado para produção nesta etapa.

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

1. Fechar a matriz de modelos, pesos e dados de treinamento; obter autorização escrita ou selecionar um modelo treinado com dados e direitos compatíveis com uso comercial e redistribuição.
2. Fazer um protótipo técnico isolado com um candidato, sem distribuir pesos nem habilitar a função na PWA, para medir viabilidade do pipeline ONNX/WASM.
3. Somente após aprovação de direitos, implementar o runtime ONNX Web em Web Worker e o contrato TypeScript de disponibilidade, instalação do modelo, separação, progresso, cancelamento e limpeza.
4. Validar o primeiro modelo aprovado em iPhone Safari/PWA, com perfil econômico, segmentos, limites de memória e armazenamento offline.
5. Validar Android Chrome/PWA, WebGPU quando compatível e fallback WASM.
6. Integrar os quatro resultados à Biblioteca e ao fluxo Downloader → Stems, sem novo download nem cópia desnecessária do original.
7. Testar WAV/MP3, integridade, duração, canais, sample rate, cancelamento, falhas, armazenamento e ausência de tráfego de áudio para servidores.
8. Se a PWA não for estável o suficiente, avaliar runtimes nativos iOS e Android.
9. Implementar runtimes Windows e macOS depois da validação mobile.

## Critérios de aceite do primeiro motor

- Separar uma faixa estéreo autorizada em quatro stems.
- Conferir duração, canais, sample rate e reprodução dos quatro resultados.
- Medir tempo, RAM e VRAM em hardware de referência.
- Testar CPU e GPU quando disponíveis.
- Testar arquivos longos, nomes com acentos/espaços, falta de espaço, cancelamento e falhas.
- Confirmar que nenhuma mídia é transmitida pela rede durante a separação.
- Confirmar que os quatro resultados entram na Biblioteca e podem ser exportados.
