import { useEffect, useMemo, useState } from 'react'
import './App.css'

const initialProducts = [
  {
    id: 1,
    name: 'Mesa de trabalho',
    category: 'Escritório',
    price: 820,
    image:
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
    description: 'Uma mesa para organizar o trabalho e deixar o espaço com a sua cara.',
    featured: true,
  },
  {
    id: 2,
    name: 'Artes em moldura',
    category: 'Decoração',
    price: 220,
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    description: 'Arte para trazer cor e personalidade às paredes da casa.',
    featured: true,
  },
  {
    id: 3,
    name: 'Kit de iluminação',
    category: 'Iluminação',
    price: 380,
    image:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80',
    description: 'Uma luz bem escolhida muda o clima de qualquer canto.',
    featured: false,
  },
  {
    id: 4,
    name: 'Lixeira premium',
    category: 'Acessórios',
    price: 149,
    image:
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80',
    description: 'Um acessório prático que ajuda a manter o espaço em ordem.',
    featured: false,
  },
]

const refreshedDescriptions = {
  1: ['Conjunto com visual premium para espaços de trabalho de inspiração.', 'Uma mesa para organizar o trabalho e deixar o espaço com a sua cara.'],
  2: ['Peças com acabamentos sofisticados para compor ambientes.', 'Arte para trazer cor e personalidade às paredes da casa.'],
  3: ['Lampadas e acessórios para valorizar detalhes e ambientações.', 'Uma luz bem escolhida muda o clima de qualquer canto.'],
  4: ['Objeto funcional como detalhe de acabamento e organização.', 'Um acessório prático que ajuda a manter o espaço em ordem.'],
}

const defaultTheme = {
  name: 'Clássico',
  primary: '#b45309',
  secondary: '#111827',
  accent: '#f4d5a3',
  background: '#fff7ed',
  surface: '#ffffff',
  text: '#171717',
  muted: '#4b5563',
}

const storageKey = 'zoo-catalog-products'
const interestKey = 'zoo-catalog-interest'
const themeKey = 'zoo-catalog-theme'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function getBrandMonogram(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'LO'
}

const whatsappNumber = '5581989769880'
const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'zoo2026'
const wallpaperStorageKey = 'zoo-catalog-wallpaper'
const companyStorageKey = 'zoo-catalog-company'
const brandImageStorageKey = 'zoo-catalog-brand-image'
const socialStorageKey = 'zoo-catalog-social-links'
const socialNetworks = [
  { key: 'instagram', label: 'Instagram', domain: 'instagram.com' },
  { key: 'facebook', label: 'Facebook', domain: 'facebook.com' },
  { key: 'tiktok', label: 'TikTok', domain: 'tiktok.com' },
  { key: 'youtube', label: 'YouTube', domain: 'youtube.com' },
]

function readSocialLinks() {
  let saved
  try {
    saved = JSON.parse(localStorage.getItem(socialStorageKey) || '{}')
  } catch {
    return {}
  }
  return socialNetworks.reduce((links, network) => {
    const value = saved[network.key]
    if (typeof value !== 'string' || !value.trim()) return links
    try {
      const url = new URL(value)
      const host = url.hostname.toLowerCase()
      if (url.protocol === 'https:' && (host === network.domain || host.endsWith(`.${network.domain}`))) {
        links[network.key] = url.href
      }
    } catch {
      return links
    }
    return links
  }, {})
}

function getProductImages(product) {
  const images = Array.isArray(product.images) && product.images.length
    ? product.images
    : [product.image]
  return images.map((image) => safeUploadedImage(image) || safeImageUrl(image)).filter(Boolean)
}

function normalizeProducts(products) {
  return products.map((product) => {
    const images = getProductImages(product)
    const refreshedDescription = refreshedDescriptions[product.id]
    const description = refreshedDescription && product.description === refreshedDescription[0]
      ? refreshedDescription[1]
      : product.description
    return { ...product, description, image: images[0] || '', images }
  })
}

function optimizeBrandImage(file, maxDimension = 512) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return Promise.reject(new Error('Escolha uma imagem JPG, PNG ou WebP.'))
  }
  if (file.size > 10 * 1024 * 1024) {
    return Promise.reject(new Error('A imagem deve ter no máximo 10 MB.'))
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      if (image.naturalWidth * image.naturalHeight > 40000000) {
        reject(new Error('A resolução da imagem é muito alta. Escolha uma imagem menor.'))
        return
      }
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(image.naturalWidth * scale)
      canvas.height = Math.round(image.naturalHeight * scale)
      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('Não foi possível processar essa imagem.'))
        return
      }
      try {
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        const optimizedImage = canvas.toDataURL('image/webp', 0.78)
        if (optimizedImage.length > 1500000) {
          reject(new Error('A imagem otimizada ficou muito grande. Escolha um arquivo menor.'))
          return
        }
        resolve(optimizedImage)
      } catch {
        reject(new Error('Não foi possível processar essa imagem.'))
      }
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Não foi possível abrir essa imagem.'))
    }
    image.src = objectUrl
  })
}

function safeImageUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.href : ''
  } catch {
    return ''
  }
}

function safeUploadedImage(value) {
  return /^data:image\/webp;base64,[A-Za-z0-9+/]+=*$/.test(value) ? value : ''
}

function createWhatsAppUrl(product, options = 'Não se aplica') {
  const message = [
    'Olá! Gostaria de finalizar a compra deste item:',
    `• Produto: ${product.name}`,
    `• Valor: ${currency.format(product.price)}`,
    `• Opções selecionadas: ${options || 'Não se aplica'}`,
    '',
    'Por favor, me informe os próximos passos para o pagamento e entrega!',
  ].join('\n')
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
}

function App() {
  const [loadingPhase, setLoadingPhase] = useState(() => (
    window.location.pathname.replace(/\/+$/, '').endsWith('/admin') ? 'hidden' : 'loading'
  ))
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    return normalizeProducts(saved ? JSON.parse(saved) : initialProducts)
  })
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(themeKey)
    return saved ? JSON.parse(saved) : defaultTheme
  })
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('zoo-catalog-dark-mode') === 'true')
  const [wallpaper, setWallpaper] = useState(() => {
    const saved = localStorage.getItem(wallpaperStorageKey) || ''
    return safeImageUrl(saved) || safeUploadedImage(saved)
  })
  const [adminAuthenticated, setAdminAuthenticated] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [adminMessage, setAdminMessage] = useState('')
  const [identityMessage, setIdentityMessage] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [interestList, setInterestList] = useState(() => {
    const saved = localStorage.getItem(interestKey)
    return saved ? JSON.parse(saved) : []
  })
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todas')
  const [showPrices, setShowPrices] = useState(true)
  const [company, setCompany] = useState(() => localStorage.getItem(companyStorageKey) || 'Loft & Co.')
  const [companyInput, setCompanyInput] = useState(() => localStorage.getItem(companyStorageKey) || 'Loft & Co.')
  const [socialLinks, setSocialLinks] = useState(readSocialLinks)
  const [socialDraft, setSocialDraft] = useState(readSocialLinks)
  const [socialMessage, setSocialMessage] = useState('')
  const [gallerySelection, setGallerySelection] = useState({})
  const [shoppingScreen, setShoppingScreen] = useState('catalog')
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [brandImage, setBrandImage] = useState(() => localStorage.getItem(brandImageStorageKey) || '')
  const [productImages, setProductImages] = useState([])
  const [imageUploadMessage, setImageUploadMessage] = useState('')

  useEffect(() => {
    if (loadingPhase !== 'loading') return undefined
    const loadingDuration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 300 : 1050
    const timer = window.setTimeout(() => setLoadingPhase('leaving'), loadingDuration)
    return () => window.clearTimeout(timer)
  }, [loadingPhase])

  useEffect(() => {
    if (loadingPhase !== 'leaving') return undefined
    const timer = window.setTimeout(() => setLoadingPhase('hidden'), 320)
    return () => window.clearTimeout(timer)
  }, [loadingPhase])

  useEffect(() => {
    localStorage.setItem(interestKey, JSON.stringify(interestList))
  }, [interestList])

  useEffect(() => {
    localStorage.setItem(themeKey, JSON.stringify(theme))
  }, [theme])

  useEffect(() => {
    localStorage.setItem('zoo-catalog-dark-mode', String(darkMode))
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem(companyStorageKey, company)
  }, [company])

  const isAdminRoute = window.location.pathname.replace(/\/+$/, '').endsWith('/admin')
  const activeTheme = darkMode
    ? {
        ...theme,
        background: '#111827',
        surface: '#1f2937',
        text: '#f9fafb',
        muted: '#cbd5e1',
      }
    : theme
  const shellStyle = {
    '--primary': activeTheme.primary,
    '--secondary': activeTheme.secondary,
    '--accent': activeTheme.accent,
    '--background': activeTheme.background,
    '--surface': activeTheme.surface,
    '--text': activeTheme.text,
    '--muted': activeTheme.muted,
    '--wallpaper': wallpaper ? `url("${wallpaper}")` : 'none',
    '--page-overlay': wallpaper
      ? darkMode
        ? 'rgba(17, 24, 39, 0.74)'
        : 'rgba(255, 247, 237, 0.68)'
      : 'transparent',
  }

  const categories = useMemo(
    () => ['Todas', ...new Set(products.map((product) => product.category))],
    [products],
  )

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = category === 'Todas' || product.category === category
      const matchesText = `${product.name} ${product.description}`
        .toLowerCase()
        .includes(search.toLowerCase())
      return matchesCategory && matchesText
    })
  }, [products, category, search])

  const featuredProduct = products.find((product) => product.featured) || products[0]

  function addToInterest(product) {
    setInterestList((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...current, { ...product, quantity: 1 }]
    })
  }

  function changeInterestQuantity(id, delta) {
    setInterestList((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  function openWhatsApp(product) {
    window.open(createWhatsAppUrl(product), '_blank', 'noopener,noreferrer')
  }

  function showProduct(product) {
    setSelectedProductId(product.id)
    setShoppingScreen('product')
  }

  function sendToWhatsApp() {
    if (!interestList.length) {
      setAdminMessage('Adicione ao menos um produto à lista antes de enviar.')
      return
    }
    const itemsText = interestList
      .map((item) => `- ${item.name} (${item.quantity}x)${item.notes ? ` — ${item.notes}` : ''}`)
      .join('\n')
    const message = encodeURIComponent(
      `Olá ${company}! Gostaria de finalizar a compra dos seguintes itens:\n\n${itemsText}\n\nPor favor, me informe os próximos passos para o pagamento e entrega!`,
    )
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank', 'noopener,noreferrer')
  }

  function removeWallpaper() {
    try {
      localStorage.removeItem(wallpaperStorageKey)
      setWallpaper('')
      setImageUploadMessage('')
      setAdminMessage('Imagem de fundo removida.')
    } catch {
      setImageUploadMessage('Não foi possível remover a imagem de fundo.')
    }
  }

  async function handleProductImageUpload(event) {
    const input = event.currentTarget
    const files = Array.from(input.files || [])
    if (!files.length) return
    try {
      const availableSlots = Math.max(0, 5 - productImages.length)
      if (availableSlots === 0) {
        setImageUploadMessage('Cada produto pode ter até 5 fotos. Remova uma foto antes de adicionar outras.')
        return
      }
      const images = await Promise.all(files.slice(0, availableSlots).map((file) => optimizeBrandImage(file, 1200)))
      setProductImages((current) => [...current, ...images])
      setImageUploadMessage(files.length > availableSlots
        ? `${images.length} foto(s) carregada(s). O limite é de 5 por produto.`
        : `${images.length} foto(s) carregada(s).`)
    } catch (error) {
      setImageUploadMessage(error instanceof Error ? error.message : 'Não foi possível carregar a foto do produto.')
    } finally {
      input.value = ''
    }
  }

  async function handleWallpaperUpload(event) {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return
    try {
      const image = await optimizeBrandImage(file, 1600)
      localStorage.setItem(wallpaperStorageKey, image)
      setWallpaper(image)
      setImageUploadMessage('Imagem de fundo carregada e aplicada.')
    } catch (error) {
      setImageUploadMessage(error instanceof Error ? error.message : 'Não foi possível carregar a imagem de fundo.')
    } finally {
      input.value = ''
    }
  }

  function saveStoreIdentity() {
    const name = companyInput.trim()
    if (!name) {
      setIdentityMessage('Informe o nome da loja.')
      return
    }
    try {
      localStorage.setItem(companyStorageKey, name)
      setCompany(name)
      setIdentityMessage('Identidade da loja salva.')
    } catch {
      setIdentityMessage('Não foi possível salvar. Libere espaço no armazenamento do navegador e tente novamente.')
    }
  }

  function saveSocialLinks() {
    const nextLinks = {}
    for (const network of socialNetworks) {
      const value = socialDraft[network.key]?.trim()
      if (!value) continue
      let url
      try {
        url = new URL(value)
      } catch {
        setSocialMessage(`Informe um link válido para ${network.label}.`)
        return
      }
      const host = url.hostname.toLowerCase()
      if (url.protocol !== 'https:' || (host !== network.domain && !host.endsWith(`.${network.domain}`))) {
        setSocialMessage(`Use um link HTTPS válido do ${network.label}.`)
        return
      }
      nextLinks[network.key] = url.href
    }
    try {
      localStorage.setItem(socialStorageKey, JSON.stringify(nextLinks))
      setSocialLinks(nextLinks)
      setSocialMessage('Redes sociais salvas.')
    } catch {
      setSocialMessage('Não foi possível salvar. Libere espaço no armazenamento do navegador e tente novamente.')
    }
  }

  async function handleBrandImageUpload(event) {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return
    try {
      const image = await optimizeBrandImage(file)
      localStorage.setItem(brandImageStorageKey, image)
      setBrandImage(image)
      setIdentityMessage('Foto da loja atualizada.')
    } catch (error) {
      setIdentityMessage(error instanceof Error ? error.message : 'Não foi possível salvar a foto da loja.')
    } finally {
      input.value = ''
    }
  }

  function removeBrandImage() {
    try {
      localStorage.removeItem(brandImageStorageKey)
      setBrandImage('')
      setIdentityMessage('Foto da loja removida.')
    } catch {
      setIdentityMessage('Não foi possível remover a foto da loja.')
    }
  }

  function handleAdminLogin(event) {
    event.preventDefault()
    const submittedPassword = new FormData(event.currentTarget).get('password')
    if (submittedPassword !== adminPassword) {
      setAdminError('Senha incorreta.')
      return
    }
    setAdminAuthenticated(true)
    setAdminError('')
  }

  function handleAdminLogout() {
    setAdminAuthenticated(false)
  }

  function submitProduct(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') || '').trim()
    const category = String(form.get('category') || '').trim()
    const description = String(form.get('description') || '').trim()
    const price = Number(form.get('price'))
    const images = productImages.map((image) => safeUploadedImage(image) || safeImageUrl(image)).filter(Boolean)
    if (!name || !category || !description || !Number.isFinite(price) || price <= 0 || !images.length) {
      setAdminMessage('Preencha os dados do produto e envie uma foto pelo computador.')
      return
    }
    const product = {
      id: editingId ?? Date.now(),
      name,
      category,
      price,
      image: images[0],
      images,
      description,
      featured: false,
    }

    const updatedProducts = editingId
      ? products.map((entry) => entry.id === editingId ? product : entry)
      : [product, ...products]
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedProducts))
    } catch {
      setImageUploadMessage('Não foi possível salvar. Remova algumas imagens ou use arquivos menores para liberar espaço no navegador.')
      return
    }
    setProducts(updatedProducts)
    event.currentTarget.reset()
    setProductImages([])
    setEditingId(null)
    setAdminMessage(editingId ? 'Produto atualizado.' : 'Produto adicionado.')
  }

  function editProduct(product) {
    setEditingId(product.id)
    const form = document.querySelector('.admin-product-form')
    if (!form) return
    form.elements.name.value = product.name
    form.elements.category.value = product.category
    form.elements.price.value = product.price
    setProductImages(getProductImages(product))
    form.elements.description.value = product.description
  }

  function deleteProduct(productId) {
    const updatedProducts = products.filter((product) => product.id !== productId)
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedProducts))
    } catch {
      setImageUploadMessage('Não foi possível salvar. Remova algumas imagens ou use arquivos menores para liberar espaço no navegador.')
      return
    }
    setProducts(updatedProducts)
    setInterestList((current) => current.filter((item) => item.id !== productId))
    setAdminMessage('Produto removido.')
  }

  function applyThemePreset(name) {
    const presets = {
      quente: {
        name: 'quente',
        primary: '#b45309',
        secondary: '#111827',
        accent: '#f4d5a3',
        background: '#fff7ed',
        surface: '#ffffff',
        text: '#171717',
        muted: '#4b5563',
      },
      moderno: {
        name: 'moderno',
        primary: '#1d4ed8',
        secondary: '#0f172a',
        accent: '#bfdbfe',
        background: '#eff6ff',
        surface: '#ffffff',
        text: '#0f172a',
        muted: '#475569',
      },
      escuro: {
        name: 'escuro',
        primary: '#a16207',
        secondary: '#111827',
        accent: '#eab308',
        background: '#111827',
        surface: '#1f2937',
        text: '#f8fafc',
        muted: '#d1d5db',
      },
    }

    setTheme(presets[name])
  }

  if (isAdminRoute) {
    return (
      <div className={`catalog-shell admin-shell${darkMode ? ' dark-mode' : ''}`} style={shellStyle}>
        <main className="admin-page">
          <a className="admin-back-link" href="/">← Voltar à vitrine</a>
          {!adminAuthenticated ? (
            <section className="admin-login-card">
              <p className="eyebrow">Área restrita</p>
              <h1>Acesso administrativo</h1>
              <p>Senha demo: <strong>zoo2026</strong>. Se configurou outra senha em <code>.env.local</code>, use a senha personalizada.</p>
              <form className="product-form" onSubmit={handleAdminLogin}>
                <label htmlFor="admin-password">Senha</label>
                <input id="admin-password" name="password" type="password" autoComplete="current-password" required />
                <button className="primary-btn full" type="submit">Entrar</button>
                {adminError && <p className="form-message" role="alert">{adminError}</p>}
              </form>
            </section>
          ) : (
            <>
              <header className="admin-heading">
                <div>
                  <p className="eyebrow">Área restrita · demonstração</p>
                  <h1>Gerenciar vitrine</h1>
                </div>
                <button type="button" className="secondary-btn" onClick={handleAdminLogout}>Sair</button>
              </header>
              <section className="admin-content">
                <section className="panel-box store-identity-panel">
                  <h2>Identidade da loja</h2>
                  <label>Nome da loja<input value={companyInput} onChange={(event) => setCompanyInput(event.target.value)} maxLength={60} /></label>
                  <div className="brand-identity-preview">
                    {brandImage ? <img src={brandImage} alt="Prévia da foto da loja" /> : <span>Z</span>}
                    <label>Enviar foto da loja
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleBrandImageUpload} />
                    </label>
                  </div>
                  <div className="theme-actions">
                    <button className="primary-btn small" type="button" onClick={saveStoreIdentity}>Salvar identidade</button>
                    {brandImage && <button className="secondary-btn small" type="button" onClick={removeBrandImage}>Remover foto</button>}
                  </div>
                  <p className="form-hint">JPG, PNG ou WebP · até 10 MB. A imagem é otimizada e salva neste navegador.</p>
                  {identityMessage && <p className="form-message" role="status">{identityMessage}</p>}
                </section>
                <section className="panel-box social-admin-panel">
                  <h2>Redes sociais</h2>
                  <p className="form-hint">Adicione os links HTTPS dos perfis da loja. Eles aparecem no rodapé da vitrine.</p>
                  <div className="product-form">
                    {socialNetworks.map((network) => (
                      <label key={network.key} htmlFor={`social-${network.key}`}>{network.label}
                        <input id={`social-${network.key}`} type="url" inputMode="url" placeholder={`https://${network.domain}/...`} value={socialDraft[network.key] || ''} onChange={(event) => setSocialDraft((current) => ({ ...current, [network.key]: event.target.value }))} />
                      </label>
                    ))}
                    <button type="button" className="primary-btn full" onClick={saveSocialLinks}>Salvar redes sociais</button>
                  </div>
                  {socialMessage && <p className="form-message" role="status">{socialMessage}</p>}
                </section>
                <div className="panel-box">
                  <h2>{editingId ? 'Editar produto' : 'Adicionar produto'}</h2>
                  <form className="product-form admin-product-form" onSubmit={submitProduct}>
                    <label>Nome<input name="name" required /></label>
                    <label>Categoria<input name="category" required /></label>
                    <label>Preço<input name="price" type="number" min="0.01" step="0.01" required /></label>
                    <label>Fotos do produto (até 5; selecione várias de uma vez)<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleProductImageUpload} /></label>
                    {productImages.length > 0 && <div className="admin-image-previews">{productImages.map((image, index) => (
                      <div key={`${index}-${image.slice(-24)}`}>
                        <img className="image-upload-preview" src={image} alt={`Prévia ${index + 1} da foto do produto`} />
                        <button type="button" className="secondary-btn small danger" onClick={() => setProductImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}>Remover foto {index + 1}</button>
                      </div>
                    ))}</div>}
                    {imageUploadMessage && <p className="form-message" role="status">{imageUploadMessage}</p>}
                    <label>Descrição<textarea name="description" required /></label>
                    <p className="form-hint">WhatsApp configurado: +55 81 98976-9880</p>
                    <button className="primary-btn full" type="submit">{editingId ? 'Salvar alterações' : 'Adicionar produto'}</button>
                    {adminMessage && <p className="form-message" role="status">{adminMessage}</p>}
                  </form>
                </div>
                <section className="panel-box admin-table">
                  <h2>Produtos cadastrados</h2>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Produto</th><th>Preço</th><th>Ações</th></tr></thead>
                      <tbody>{products.map((product) => (
                        <tr key={product.id}>
                          <td>{product.name}</td>
                          <td>{currency.format(product.price)}</td>
                          <td className="table-actions">
                            <button type="button" className="secondary-btn small" onClick={() => editProduct(product)}>Editar</button>
                            <button type="button" className="secondary-btn small danger" onClick={() => deleteProduct(product.id)}>Excluir</button>
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </section>
              </section>
              <p className="admin-notice">Painel demonstrativo local. Não representa uma área protegida para produção.</p>
            </>
          )}
        </main>
      </div>
    )
  }

  return (
    <div className={`catalog-shell${darkMode ? ' dark-mode' : ''}${shoppingScreen !== 'catalog' ? ' shopping-screen-active' : ''}`} style={shellStyle} aria-busy={loadingPhase !== 'hidden'}>
      {loadingPhase !== 'hidden' && (
        <div className={`store-loader${loadingPhase === 'leaving' ? ' is-leaving' : ''}`} role="status" aria-live="polite">
          <div className="store-loader-content">
            <div className="store-loader-mark">{brandImage ? <img src={brandImage} alt="" /> : getBrandMonogram(company)}</div>
            <p className="store-loader-label">{company}</p>
            <h1>Inspiração para cada espaço.</h1>
            <p className="store-loader-caption">Estamos abrindo a vitrine.</p>
            <div className="store-loader-track"><span /></div>
          </div>
        </div>
      )}
      <header className="catalog-header">
        <div className="brand-block">
          <div className="brand-mark">{brandImage ? <img src={brandImage} alt="" /> : getBrandMonogram(company)}</div>
          <div>
            <p className="eyebrow">{getBrandMonogram(company)}</p>
            <strong>{company}</strong>
          </div>
        </div>
        <nav className="catalog-nav">
          <a href="#catalogo">Produtos</a>
        </nav>
        <div className="header-actions">
          <a className="admin-entry-link" href={`${import.meta.env.BASE_URL}admin/`}>Área da equipe</a>
          <button type="button" className="theme-toggle" onClick={() => setDarkMode((value) => !value)} aria-pressed={darkMode}>
            {darkMode ? '☀️ Claro' : '🌙 Escuro'}
          </button>
          <button type="button" className="primary-btn small" onClick={() => setShowPrices((value) => !value)}>
            {showPrices ? 'Ocultar preços' : 'Mostrar preços'}
          </button>
          {Object.keys(socialLinks).length > 0 && (
            <nav className="social-header-links" aria-label="Redes sociais da loja">
              {socialNetworks.filter((network) => socialLinks[network.key]).map((network) => (
                <a key={network.key} href={socialLinks[network.key]} target="_blank" rel="noopener noreferrer">{network.label}</a>
              ))}
            </nav>
          )}
          <button type="button" className="cart-button" onClick={() => setShoppingScreen('cart')}>Minha lista • {interestList.reduce((sum, item) => sum + item.quantity, 0)}</button>
        </div>
      </header>

      <main className="catalog-main">
        <section className="hero-section" id="inicio">
          <div className="hero-copy">
            <p className="eyebrow">Vitrine digital</p>
            <h1>Ideias para deixar a casa mais sua.</h1>
            <p>
              Ideias para deixar a casa e o trabalho mais bonitos, com atendimento direto pelo WhatsApp.
            </p>
            <div className="hero-actions">
              <a href="#catalogo" className="primary-btn">Ver catálogo</a>
              <button type="button" className="secondary-btn" onClick={sendToWhatsApp}>Falar no WhatsApp</button>
            </div>
          </div>
          <div className="hero-card">
            {featuredProduct && <img className="hero-card-image" src={featuredProduct.image} alt="" aria-hidden="true" />}
            <div className="hero-card-content">
              <span className="mini-tag">Em destaque</span>
              <h3>{featuredProduct?.name || 'Atelier em destaque'}</h3>
              <p>{featuredProduct?.description || 'Produtos selecionados para apresentar sua vitrine.'}</p>
            </div>
          </div>
        </section>

        <section className="catalog-toolbar" id="catalogo">
          <input
            placeholder="Buscar produto"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </section>

        <section className="content-layout">
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <article key={product.id} className="product-card">
                <button type="button" className="product-image-action" onClick={() => showProduct(product)} aria-label={`Ver detalhes de ${product.name}`}>
                  <img src={getProductImages(product)[gallerySelection[product.id] || 0] || product.image} alt={product.name} loading="lazy" />
                </button>
                {getProductImages(product).length > 1 && <div className="product-thumbnails" aria-label={`Fotos de ${product.name}`}>
                  {getProductImages(product).map((image, index) => (
                    <button key={`${product.id}-${index}`} type="button" className={gallerySelection[product.id] === index ? 'active' : ''} onClick={() => setGallerySelection((current) => ({ ...current, [product.id]: index }))} aria-label={`Ver foto ${index + 1} de ${product.name}`} aria-pressed={gallerySelection[product.id] === index}>
                      <img src={image} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>}
                <div className="product-body">
                  <span className="tag">{product.category}</span>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="product-meta">
                    <strong>{showPrices ? currency.format(product.price) : 'Sob consulta'}</strong>
                    <div className="product-actions">
                      <button type="button" className="primary-btn small" onClick={() => showProduct(product)}>Ver produto</button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="interest-panel" id="lista">
            <div className="panel-title">
              <p className="eyebrow">Lista de interesse</p>
              <h3>Produtos selecionados</h3>
            </div>

            {interestList.length === 0 ? (
              <p className="empty">Nenhum item adicionado ainda.</p>
            ) : (
              <div className="interest-list">
                {interestList.map((item) => (
                  <div key={item.id} className="interest-item">
                    <div>
                      <strong>{item.name}</strong>
                      {showPrices && <span>{currency.format(item.price)}</span>}
                    </div>
                    <div className="quantity-controls">
                      <button type="button" onClick={() => changeInterestQuantity(item.id, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => changeInterestQuantity(item.id, 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button type="button" className="primary-btn full" onClick={sendToWhatsApp}>Enviar lista por WhatsApp</button>
            {adminMessage && <p className="form-message" role="status">{adminMessage}</p>}
          </aside>
        </section>

        <section className="bottom-grid">
          <div className="panel-box theme-box">
            <p className="eyebrow">Personalização</p>
            <h3>Visual</h3>
            <div className="theme-actions">
              <button type="button" className="secondary-btn small" onClick={() => applyThemePreset('quente')}>Quente</button>
              <button type="button" className="secondary-btn small" onClick={() => applyThemePreset('moderno')}>Moderno</button>
              <button type="button" className="secondary-btn small" onClick={() => applyThemePreset('escuro')}>Escuro</button>
            </div>
            <div className="color-picks">
              <label><span>Primária</span><input type="color" value={theme.primary} onChange={(event) => setTheme((current) => ({ ...current, primary: event.target.value }))} /></label>
              <label><span>Secundária</span><input type="color" value={theme.secondary} onChange={(event) => setTheme((current) => ({ ...current, secondary: event.target.value }))} /></label>
              <label><span>Detalhe</span><input type="color" value={theme.accent} onChange={(event) => setTheme((current) => ({ ...current, accent: event.target.value }))} /></label>
            </div>
            <label className="wallpaper-field">Imagem de fundo (envie do computador)
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleWallpaperUpload} />
            </label>
            {imageUploadMessage && <p className="form-message" role="status">{imageUploadMessage}</p>}
            <div className="theme-actions">
              <button type="button" className="secondary-btn small" onClick={removeWallpaper}>Remover imagem</button>
            </div>
          </div>
        </section>
      </main>
      {shoppingScreen !== 'catalog' && (
        <section className="shopping-screen" aria-label={shoppingScreen === 'product' ? 'Detalhes do produto' : 'Lista de interesse'}>
          <header className="shopping-screen-header">
            <button type="button" className="secondary-btn" onClick={() => setShoppingScreen('catalog')}>← Voltar aos produtos</button>
            <strong>{shoppingScreen === 'product' ? 'Detalhes do produto' : 'Minha lista de interesse'}</strong>
            {shoppingScreen === 'product' && <button type="button" className="secondary-btn" onClick={() => setShoppingScreen('cart')}>Minha lista ({interestList.reduce((sum, item) => sum + item.quantity, 0)})</button>}
          </header>
          {shoppingScreen === 'product' && products.filter((product) => product.id === selectedProductId).map((product) => (
            <article key={product.id} className="product-detail-screen">
              <div>
                <img className="product-detail-image" src={getProductImages(product)[gallerySelection[product.id] || 0] || product.image} alt={product.name} />
                {getProductImages(product).length > 1 && <div className="product-thumbnails">
                  {getProductImages(product).map((image, index) => (
                    <button key={`${product.id}-${index}`} type="button" className={gallerySelection[product.id] === index ? 'active' : ''} onClick={() => setGallerySelection((current) => ({ ...current, [product.id]: index }))} aria-label={`Ver foto ${index + 1} de ${product.name}`} aria-pressed={gallerySelection[product.id] === index}><img src={image} alt="" /></button>
                  ))}
                </div>}
              </div>
              <div className="product-detail-copy">
                <p className="eyebrow">{product.category}</p>
                <h1>{product.name}</h1>
                <strong className="product-detail-price">{showPrices ? currency.format(product.price) : 'Sob consulta'}</strong>
                <p>{product.description}</p>
                <button type="button" className="primary-btn full" onClick={() => { addToInterest(product); setShoppingScreen('cart') }}>Adicionar à minha lista</button>
                <button type="button" className="secondary-btn full" onClick={() => openWhatsApp(product)}>Solicitar pelo WhatsApp</button>
              </div>
            </article>
          ))}
          {shoppingScreen === 'cart' && <section className="shopping-cart-screen">
            <h1>Minha lista de interesse</h1>
            {interestList.length === 0 ? <p className="empty">Nenhum produto adicionado à lista.</p> : interestList.map((item) => (
              <div key={item.id} className="interest-item">
                <div><strong>{item.name}</strong>{showPrices && <span>{currency.format(item.price)}</span>}</div>
                <div className="quantity-controls">
                  <button type="button" aria-label={`Diminuir quantidade de ${item.name}`} onClick={() => changeInterestQuantity(item.id, -1)}>-</button>
                  <span>{item.quantity}</span>
                  <button type="button" aria-label={`Aumentar quantidade de ${item.name}`} onClick={() => changeInterestQuantity(item.id, 1)}>+</button>
                </div>
              </div>
            ))}
            <button type="button" className="primary-btn full" onClick={sendToWhatsApp}>Enviar lista por WhatsApp</button>
            {adminMessage && <p className="form-message" role="status">{adminMessage}</p>}
          </section>}
        </section>
      )}
      {Object.keys(socialLinks).length > 0 && (
        <footer className="social-footer">
          <strong>Siga {company}</strong>
          <nav aria-label="Redes sociais da loja">
            {socialNetworks.filter((network) => socialLinks[network.key]).map((network) => (
              <a key={network.key} href={socialLinks[network.key]} target="_blank" rel="noopener noreferrer">{network.label}</a>
            ))}
          </nav>
        </footer>
      )}
    </div>
  )
}

export default App
