# AUDIOX Stems Browser Lab

Protótipo **isolado** para testar a execução de SCNet via ONNX Runtime Web no navegador. Não faz parte da aplicação de produção, não altera a tela Stems e não inclui pesos de IA no repositório.

## Escopo desta experiência

- Um arquivo local selecionado pelo usuário.
- Limite intencional de 8 segundos e 20 MB para o primeiro teste.
- Áudio decodificado no navegador e transferido para um Web Worker.
- SCNet INT8 executado via ONNX Runtime Web com backend WASM/CPU.
- Quatro stems retornados para a página e disponibilizados como WAV.
- Nenhum áudio enviado a servidor.
- O modelo é obtido sob demanda pelo runtime e pode ser guardado na Cache API do navegador.

**Atenção:** os pesos SCNet têm declaração MIT do autor, mas foram treinados com MUSDB18-HQ, cujo material tem restrições de uso comercial. Por isso, o protótipo é apenas uma avaliação técnica controlada. Não empacotar, redistribuir ou promover esses pesos como modelo comercial aprovado.

## Requisitos

- Node.js 18 ou superior.
- Safari 16.4+ ou Chromium moderno com WebAssembly SIMD.
- Conexão à internet no primeiro uso para obter ONNX Runtime Web e o modelo SCNet (aprox. 12,9 MB, além dos arquivos do runtime).
- Espaço de memória livre. Inferência de áudio pode consumir muita RAM; feche outras abas e aplicativos se necessário.

## Executar

A partir desta pasta:

```bash
npm install
npm run dev
```

Abra o endereço local mostrado pelo Vite. Para testar em um iPhone na mesma rede Wi-Fi, use o endereço de rede do computador. Safari pode exigir contexto seguro (HTTPS) para recursos modernos; para teste remoto, use um túnel HTTPS confiável ou hospedagem temporária de preview. Não publique este laboratório como parte da PWA de produção.

Para validar a compilação:

```bash
npm run build
npm run preview
```

## Integração de inferência validada no código

O laboratório chama a API pública do pacote `@audio/neural-separate` com o formato documentado `{ channelData, sampleRate }`, seleciona o preset `scnet` e força `device: 'wasm'`. O pacote usa `onnxruntime-web` no navegador e busca os pesos SCNet hospedados pelo projeto do modelo; o arquivo de pesos não está incluído no bundle do AUDIOX. O callback `progress` acompanha os segmentos de inferência, não o percentual do download inicial do modelo, por isso a interface não inventa uma porcentagem para essa etapa.

O pacote contém importações dinâmicas para caminhos Node.js e navegador. O Vite pode emitir avisos sobre módulos `node:*` externalizados durante o build; esses caminhos são condicionais e o runtime de navegador seleciona `onnxruntime-web`. A compilação isolada passou no GitHub Actions, mas isso ainda não substitui a execução real do modelo em um navegador físico.

## Protocolo de teste

1. Comece com um trecho estéreo autorizado de 5 a 8 segundos.
2. Escolha **Iniciar teste local** e aceite o download dos recursos de modelo/runtime.
3. Observe se a página continua responsiva enquanto o Worker processa.
4. Reproduza os quatro WAVs e confira se não estão vazios, truncados ou com duração diferente da origem.
5. Repita com WASM após recarregar a página para observar o cache do modelo.
6. Registre dispositivo, sistema, navegador, tempo total, falhas, aquecimento e comportamento de memória.
7. Repita no iPhone Safari e Android Chrome. O resultado de desktop não substitui esses testes.

## Limitações conhecidas

- O teste inicial usa WASM/CPU em todas as plataformas para comparar o caminho mais compatível. WebGPU será avaliado separadamente em Chromium/Android, nunca presumido no Safari iOS.
- A API de separação reporta progresso por segmento, não um percentual confiável do download inicial do modelo. A interface não inventa progresso durante essa etapa.
- O cancelamento encerra o Worker. Isso interrompe a execução local, mas não garante limpeza imediata de toda memória gerenciada pelo navegador.
- O teste usa a decodificação de áudio nativa do navegador. Os formatos aceitos variam entre browsers.
- O modelo é carregado a partir da origem configurada no pacote; não há modelo versionado ou hospedado pelo AUDIOX neste protótipo.
- A questão de direitos sobre os dados de treinamento ainda precisa ser resolvida antes de qualquer uso comercial.

## Dependências do laboratório

- `@audio/neural-separate@0.7.1`
- `onnxruntime-web@1.30.0`
- `vite` e `typescript` como ferramentas locais do laboratório.

As dependências não são adicionadas ao package.json principal do AUDIOX.
