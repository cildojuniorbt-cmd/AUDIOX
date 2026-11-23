# AUDIOX STEMS — pesquisa de modelos e licenças

Data da revisão: 2026-11-23  
Status: pesquisa preliminar; nenhum modelo aprovado para distribuição comercial.

## Resumo executivo

Não baixar, empacotar ou publicar pesos de modelo no AUDIOX nesta etapa. A licença do código de uma arquitetura, a licença declarada para um arquivo de pesos e os direitos sobre os dados usados no treinamento são camadas diferentes.

O candidato mais útil para um primeiro protótipo técnico é Open-Unmix UMX-HQ, por oferecer quatro saídas (vocals, drums, bass e other), ter pesos individuais relativamente pequenos e já existirem exportações ONNX. Porém, ele foi treinado com MUSDB18-HQ, cujo registro oficial limita o uso do material a fins educacionais e exige autorização dos titulares para uso comercial. Portanto, UMX-HQ fica **bloqueado para distribuição/uso comercial até esclarecimento escrito dos titulares e confirmação jurídica da cadeia de direitos**.

Demucs/HTDemucs fica igualmente bloqueado para distribuição comercial: o mantenedor declarou expressamente que os pesos pré-treinados não são cobertos pela licença MIT do código e são fornecidos apenas para fins científicos.

## Matriz preliminar

| Modelo / projeto | Capacidade | Situação técnica | Situação de licença | Decisão AUDIOX |
|---|---|---|---|---|
| Demucs / HTDemucs | 4 stems | Exportações ONNX para browser existem; arquitetura híbrida mais pesada | Código MIT, mas o mantenedor declarou que os pesos não são cobertos por MIT e são apenas para fins científicos | **Não usar em build comercial** sem autorização escrita específica |
| Open-Unmix UMX-HQ | 4 stems independentes | Candidato para protótipo ONNX/WASM; 4 redes separadas e STFT/iSTFT no host | O registro dos pesos UMX-HQ existe no Zenodo; há declarações MIT para UMX-HQ, mas o treinamento usa MUSDB18-HQ, cujo material é educacional e não comercial sem autorização dos titulares | **Somente benchmark técnico controlado**; não aprovar para distribuição comercial |
| SCNet (ONNX int8) | 4 stems | Exportação ONNX de cerca de 12,9 MB; há implementação de browser com WASM/WebGPU, mas uso em iPhone precisa ser testado | Autor confirmou MIT para pesos; checkpoint treinado em MUSDB18-HQ, cujos termos restringem o material a fins educacionais e uso comercial sem autorização | **Melhor candidato técnico para benchmark mobile; bloqueado para produção comercial até resolver direitos dos dados** |
| Open-Unmix UMX-L | 4 stems | Variante de maior capacidade | Pesos declarados CC BY-NC-SA 4.0 | **Descartar para produto comercial** |
| MixDirective Stem Splitter | 4 stems | ONNX FP16 pequeno e arquitetura derivada de HTDemucs | Pesos proprietários; licença restringe uso ao app Mix Directive e proíbe redistribuição/uso externo | **Não usar** |
| Demixr | 4 stems em app Flutter | Referência de arquitetura mobile; usa ExecuTorch/CoreML/Vulkan e ONNX CPU | Repositório do app MIT; licença dos pesos/runtime deve ser auditada separadamente | **Referência técnica, não dependência** |

## Evidências e fontes primárias

### Demucs / HTDemucs

- Issue oficial sobre licença dos modelos: https://github.com/facebookresearch/demucs/issues/327
- Em 2022-05-23, o mantenedor respondeu: “The model weights are not covered by the MIT license, and are provided only for scientific purposes.”
- O repositório de código tem licença MIT, mas isso não substitui a declaração específica sobre os pesos.
- Um espelho ONNX pode declarar MIT para sua exportação; isso, isoladamente, não altera os direitos sobre os pesos de origem.

### SCNet

- Model card ONNX: https://huggingface.co/square-zero-labs/scnet
- O checkpoint int8 publicado tem aproximadamente 12,9 MB e produz quatro stems.
- O autor confirmou MIT para os pesos e para redistribuição de conversões ONNX; ver a seção de licença do model card.
- O próprio model card informa treinamento com MUSDB18-HQ. O registro oficial desse dataset limita o material a fins educacionais e exige autorização dos titulares para uso comercial.
- Há uma demonstração de separação no navegador com WASM/WebGPU: https://audio.js.org/util/stem-splitter/. A página relata uso de memória elevado em arquivos longos, portanto o teste mobile é obrigatório.
- Decisão: candidato técnico prioritário para um benchmark de browser, mas não liberado para produção comercial até resolver a questão dos direitos do conjunto de treinamento.

### Open-Unmix UMX-HQ

- Registro dos pesos: https://zenodo.org/records/3370489
- O registro contém quatro arquivos de aproximadamente 35,6 MB cada: vocals, drums, bass e other.
- Modelo ONNX de referência e parâmetros de sinal: https://huggingface.co/edgetools/umx-hq
- O model card declara UMX-HQ como MIT e informa que o grafo publicado é apenas o alvo vocals; os outros três alvos precisam de exportações equivalentes.
- Dataset usado no treinamento: https://zenodo.org/records/3338373
- O registro oficial do MUSDB18-HQ declara que o material é fornecido apenas para fins educacionais e não deve ser usado comercialmente sem permissão expressa dos titulares.
- A licença declarada para pesos UMX-HQ e as restrições do conjunto de treinamento precisam ser analisadas em conjunto. Não presumir que uma declaração MIT no modelo ONNX resolve automaticamente os direitos dos fonogramas usados no treinamento.

### MixDirective Stem Splitter

- Model card: https://huggingface.co/MixDirective/mix-directive-stem-splitter
- O autor informa que os pesos foram treinados do zero com música própria, mas a licença é proprietária e limita o uso ao app indicado. Não é uma opção reutilizável pelo AUDIOX.

### Demixr

- Repositório: https://github.com/demixr/demixr-app
- É uma referência útil para arquitetura móvel nativa e divisão em segmentos, mas não prova que a mesma implementação funcionará em Safari/PWA. Não copiar pesos nem assumir que as licenças de cada componente são iguais à licença do app.

## Recomendação de engenharia

1. Manter a separação desativada na PWA até existir um modelo aprovado e testes reais.
2. Criar um protótipo isolado de browser com SCNet int8 como primeira referência de desempenho e Open-Unmix UMX-HQ como comparação de arquitetura; apenas benchmark controlado, sem distribuir pesos e sem usar faixas de terceiros sem autorização.
3. Implementar o caminho de áudio (decode → resample → STFT → ONNX → mask → iSTFT → stems) em Worker, começando com WASM/CPU.
4. Medir memória, tempo, aquecimento e estabilidade em Safari iOS e Chrome Android. Não prometer WebGPU no iPhone.
5. Para uma versão comercial, preferir uma destas rotas:
   - obter autorização escrita dos titulares relevantes para os pesos/dados;
   - treinar um modelo próprio com dados e contratos que permitam expressamente uso comercial e redistribuição dos pesos;
   - contratar/licenciar um modelo comercial com direitos claros para uso no AUDIOX.
6. Guardar manifesto de cada modelo com origem, revisão/commit, SHA-256, licença do código, licença dos pesos, proveniência dos dados, direitos de uso comercial, redistribuição e avisos de atribuição.

## Critérios para liberar um modelo

Um modelo só pode passar para produção quando todos os itens forem comprovados:

- [ ] Código/runtime com licença compatível.
- [ ] Pesos/checkpoint com licença e proveniência documentadas.
- [ ] Dados de treinamento com direitos compatíveis ou autorização expressa dos titulares.
- [ ] Uso comercial permitido, se o AUDIOX for comercializado ou monetizado.
- [ ] Redistribuição ou hospedagem/download pelo AUDIOX explicitamente permitidos.
- [ ] Avisos de copyright, atribuição e obrigações cumpridos.
- [ ] Hash SHA-256 e versão fixados.
- [ ] Teste técnico de qualidade, memória e desempenho em dispositivos-alvo.

Esta pesquisa é uma triagem técnica, não um parecer jurídico.
