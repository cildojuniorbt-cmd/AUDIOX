import { useState } from 'react'
import { AudioWaveform, Download, RefreshCw, Library, Settings, UploadCloud, Music2, Zap, ShieldCheck } from 'lucide-react'

type Mode = 'converter' | 'downloader'
export default function App() {
  const [mode, setMode] = useState<Mode>('converter')
  const [files, setFiles] = useState<File[]>([])
  const [format, setFormat] = useState('mp3')
  const [notice, setNotice] = useState('')

  function addFiles(list: FileList | null) {
    if (!list) return
    setFiles(old => [...old, ...Array.from(list)])
    setNotice('')
  }

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><AudioWaveform /></span><div><b>AUDIO<span>X</span></b><small>A NEXUS PRODUCT</small></div></div>
      <div className="nav-label">WORKSPACE</div>
      <button className={mode === 'converter' ? 'nav active' : 'nav'} onClick={() => setMode('converter')}><RefreshCw /> Conversor</button>
      <button className={mode === 'downloader' ? 'nav active' : 'nav'} onClick={() => setMode('downloader')}><Download /> Downloader</button>
      <button className="nav" onClick={() => setNotice('Biblioteca será conectada na próxima etapa.')}><Library /> Biblioteca</button>
      <div className="sidebar-bottom"><button className="nav" onClick={() => setNotice('Configurações em desenvolvimento.')}><Settings /> Configurações</button><div className="plan"><Zap size={17}/><div><b>AUDIOX V1</b><small>Seu estúdio de áudio</small></div></div></div>
    </aside>
    <main className="main">
      <header><div><span className="eyebrow">AUDIO WORKSPACE</span><h1>{mode === 'converter' ? 'Conversor de áudio' : 'Downloader'}</h1><p>{mode === 'converter' ? 'Transforme seus arquivos com controle e qualidade.' : 'Links e fontes com download autorizado.'}</p></div><div className="status"><i/> SISTEMA ONLINE</div></header>
      {mode === 'converter' ? <>
        <section className="hero"><div><span className="pill">✦ CONVERSÃO PROFISSIONAL</span><h2>Seu áudio.<br/><em>Seu formato.</em></h2><p>Converta áudio e vídeo com uma biblioteca ampla de formatos e configurações.</p></div><div className="orb"><AudioWaveform size={76}/><div className="orbit o1"/><div className="orbit o2"/></div></section>
        <section className="panel"><div className="section-head"><div><h3><UploadCloud/> Adicionar arquivos</h3><p>Áudio e vídeo: MP3, WAV, FLAC, M4A, MP4, MKV, MOV, WEBM e muitos outros.</p></div><span className="count">{files.length} ARQUIVOS</span></div>
          <label className="dropzone"><input type="file" multiple accept="audio/*,video/*,.flac,.ogg,.opus,.wma,.aiff,.mkv,.avi,.webm,.mov,.mp4,.mpeg,.mpg,.ts,.m2ts,.vob,.mxf,.3gp" onChange={e => addFiles(e.target.files)}/><UploadCloud size={34}/><b>Arraste seus arquivos ou <u>clique para selecionar</u></b><small>Os arquivos serão processados localmente quando possível.</small></label>
          <div className="settings-row"><div><label>FORMATO DE SAÍDA</label><select value={format} onChange={e => setFormat(e.target.value)}>{['mp3','wav','flac','m4a','aac','ogg','opus','wma','aiff','alac','ape','ac3','dts','amr','mp2','mp4','mkv','mov','avi','webm','wmv','flv','mpeg','mpg','m4v','3gp','ts','mts','m2ts','vob','ogv','mxf','asf','dv','gif'].map(x=><option key={x} value={x}>{x.toUpperCase()}</option>)}</select></div><div><label>QUALIDADE MP3</label><select defaultValue="320"><option value="320">320 kbps</option><option value="256">256 kbps</option><option value="192">192 kbps</option><option value="128">128 kbps</option></select></div><button className="primary" onClick={() => setNotice(files.length ? 'Arquivos adicionados. A disponibilidade de cada formato dependerá dos codecs habilitados no motor FFmpeg.' : 'Adicione arquivos para começar.')}>Preparar conversão <RefreshCw size={17}/></button></div>
          {files.length > 0 && <div className="file-list">{files.map((f,i)=><div className="file" key={i}><Music2/><span>{f.name}<small>{(f.size/1024/1024).toFixed(2)} MB</small></span><button onClick={() => setFiles(old => old.filter((_,n)=>n!==i))}>Remover</button></div>)}</div>}
          {notice && <div className="notice">{notice}</div>}
        </section>
      </> : <section className="panel downloader"><span className="pill">FONTES COMPATÍVEIS</span><h2>Traga seu link para o AUDIOX.</h2><p>Integrações futuras usarão APIs e fontes que autorizem expressamente o download.</p><div className="urlbox"><input placeholder="Cole aqui um link de uma fonte autorizada"/><button className="primary" onClick={() => setNotice('A análise de links será habilitada após a integração dos provedores autorizados.')}>Analisar link <Download size={17}/></button></div>{notice && <div className="notice">{notice}</div>}<div className="provider-list">YouTube · SoundCloud · Vimeo · Bandcamp · URLs diretas*</div><small>*Disponibilidade depende das permissões e recursos de cada plataforma.</small></section>}
      <footer><span><ShieldCheck/> Processamento privado e consciente</span><span>© 2026 AUDIOX · A NEXUS Product</span></footer>
    </main>
  </div>
}