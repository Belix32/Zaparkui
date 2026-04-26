import { useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { Button, Input, Textarea } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Dashboard.module.css';

type Tab = 'parkings' | 'add' | 'history';

// Security: Sanitize input
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .substring(0, 500);
}

// Security: Validate numeric values with bounds
function validateNumber(value: string, min: number, max: number): { valid: boolean; value: number; error?: string } {
  const num = Number(value);
  if (isNaN(num)) {
    return { valid: false, value: 0, error: 'Введите число' };
  }
  if (num < min) {
    return { valid: false, value: 0, error: `Минимальное значение: ${min}` };
  }
  if (num > max) {
    return { valid: false, value: 0, error: `Максимальное значение: ${max}` };
  }
  return { valid: true, value: Math.floor(num) };
}

// Security: Rate limiting for parking additions
const addParkingAttempts = new Map<string, { count: number; timestamp: number }>();
const MAX_PARKING_ADDITIONS = 10;
const ADDITION_WINDOW = 60 * 60 * 1000; // 1 hour

function checkAddParkingRateLimit(userId: string): boolean {
  const attempts = addParkingAttempts.get(userId);
  if (!attempts) return true;
  
  const elapsed = Date.now() - attempts.timestamp;
  if (elapsed > ADDITION_WINDOW) {
    addParkingAttempts.delete(userId);
    return true;
  }
  
  return attempts.count < MAX_PARKING_ADDITIONS;
}

function recordParkingAddition(userId: string): void {
  const attempts = addParkingAttempts.get(userId) || { count: 0, timestamp: 0 };
  attempts.count++;
  attempts.timestamp = Date.now();
  addParkingAttempts.set(userId, attempts);
}

export function Dashboard() {
  const { user, isAuthenticated, myParkings, addParking } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('parkings');
  const [success, setSuccess] = useState('');
  const [formError, setFormError] = useState('');
  
  // Form state for adding parking
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [spots, setSpots] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [district, setDistrict] = useState('');
  const [metro, setMetro] = useState('');
  const [parkingType, setParkingType] = useState('');

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  const handleAddParking = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    // Security: Sanitize all inputs
    const sanitizedTitle = sanitizeInput(title);
    const sanitizedAddress = sanitizeInput(address);
    const sanitizedDescription = description ? sanitizeInput(description) : '';
    
    // Security: Validate required fields
    if (!sanitizedTitle || sanitizedTitle.length < 2) {
      setFormError('Название должно быть не менее 2 символов');
      return;
    }
    
    if (!sanitizedAddress || sanitizedAddress.length < 5) {
      setFormError('Адрес должен быть не менее 5 символов');
      return;
    }
    
    // Security: Validate numeric values
    const priceCheck = validateNumber(price, 100, 100000);
    if (!priceCheck.valid) {
      setFormError(priceCheck.error || 'Неверная цена');
      return;
    }
    
    const spotsCheck = validateNumber(spots, 1, 1000);
    if (!spotsCheck.valid) {
      setFormError(spotsCheck.error || 'Неверное количество мест');
      return;
    }
    
    // Security: Rate limiting
    if (!checkAddParkingRateLimit(user.id)) {
      setFormError('Превышен лимит добавления парковок. Попробуйте позже.');
      return;
    }
    
    addParking({
      title: sanitizedTitle,
      address: sanitizedAddress,
      price: priceCheck.value,
      spots: spotsCheck.value,
      description: sanitizedDescription || undefined,
      image: imageUrl || undefined,
    });
    
    recordParkingAddition(user.id);
    
    setSuccess('Парковка успешно добавлена!');
    setTitle('');
    setAddress('');
    setPrice('');
    setSpots('');
    setDescription('');
    setImageUrl('');
    setDistrict('');
    setMetro('');
    setParkingType('');
    setDescription('');
    setImageUrl('');
    setActiveTab('parkings');
    
    setTimeout(() => setSuccess(''), 3000);
  };

  // Security: Controlled input handlers with sanitization
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(sanitizeInput(e.target.value));
  }, []);

  const handleAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(sanitizeInput(e.target.value));
  }, []);

  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric input
    const sanitized = e.target.value.replace(/[^\d]/g, '').substring(0, 6);
    setPrice(sanitized);
  }, []);

  const handleSpotsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric input
    const sanitized = e.target.value.replace(/[^\d]/g, '').substring(0, 4);
    setSpots(sanitized);
  }, []);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(sanitizeInput(e.target.value));
  }, []);

  const handleImageUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value.trim().substring(0, 500));
  }, []);
  
  // Handle file upload - convert to base64
  const handleImageFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setFormError('Выберите изображение');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Изображение должно быть меньше 5MB');
      return;
    }
    
    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setImageFile(file);
      // Also set as URL for compatibility
      setImageUrl(base64);
    };
    reader.onerror = () => {
      setFormError('Ошибка при чтении файла');
    };
    reader.readAsDataURL(file);
  }, []);
  
  const removeImage = useCallback(() => {
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
  }, []);
  
  const handleDistrictChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDistrict(sanitizeInput(e.target.value));
  }, []);
  
  const handleMetroChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMetro(sanitizeInput(e.target.value));
  }, []);
  
  const handleParkingTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setParkingType(e.target.value);
  }, []);

  return (
    <section className={styles.dashboard}>
      <div className="container">
        <div className={styles.dashboardInner}>
          <aside className={styles.sidebar}>
            <div className={styles.userCard}>
              <div className={styles.avatar}>
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className={styles.userName}>{user?.name}</div>
              <div className={styles.userEmail}>{user?.email}</div>
            </div>
            
            <nav className={styles.nav}>
              <button
                className={`${styles.navButton} ${activeTab === 'parkings' ? styles.navButtonActive : ''}`}
                onClick={() => setActiveTab('parkings')}
              >
                🚗 Мои парковки
              </button>
              <button
                className={`${styles.navButton} ${activeTab === 'add' ? styles.navButtonActive : ''}`}
                onClick={() => setActiveTab('add')}
              >
                ➕ Добавить место
              </button>
              <button
                className={`${styles.navButton} ${activeTab === 'history' ? styles.navButtonActive : ''}`}
                onClick={() => setActiveTab('history')}
              >
                📋 История
              </button>
            </nav>
          </aside>

          <main className={styles.content}>
            {activeTab === 'parkings' && (
              <>
                <div className={styles.contentHeader}>
                  <h1 className={styles.contentTitle}>Мои парковки</h1>
                </div>
                {myParkings.length > 0 ? (
                  <div className={styles.parkingsList}>
                    {myParkings.map((parking) => (
                      <div key={parking.id} className={styles.parkingItem}>
                        <div className={styles.parkingInfo}>
                          <h4>{parking.title}</h4>
                          <p>{parking.address}</p>
                        </div>
                        <div className={styles.parkingPrice}>
                          <div className={styles.price}>
                            {parking.price.toLocaleString('ru-RU')} <span>₽/мес</span>
                          </div>
                          <div className={styles.spots}>{parking.spots} мест</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.empty}>
                    <div className={styles.emptyIcon}>🚗</div>
                    <p>У вас пока нет парковок</p>
                    <p>Добавьте первую парковку</p>
                    <Button 
                      variant="secondary" 
                      style={{ marginTop: '16px' }}
                      onClick={() => setActiveTab('add')}
                    >
                      Добавить парковку
                    </Button>
                  </div>
                )}
              </>
            )}

            {activeTab === 'add' && (
              <>
                <div className={styles.contentHeader}>
                  <h1 className={styles.contentTitle}>Добавить парковку</h1>
                </div>
                {success && <div className={styles.success}>{success}</div>}
                {formError && <div className={styles.error}>{formError}</div>}
                <form className={styles.addForm} onSubmit={handleAddParking}>
                  <Input
                    label="Название ЖК"
                    placeholder="ЖК Северный"
                    value={title}
                    onChange={handleTitleChange}
                    required
                    minLength={2}
                    maxLength={100}
                  />
                  <Input
                    label="Адрес"
                    placeholder="Москва, ул. Ленина, 25"
                    value={address}
                    onChange={handleAddressChange}
                    required
                    minLength={5}
                    maxLength={200}
                  />
                  <Input
                    type="number"
                    label="Цена (₽/мес)"
                    placeholder="8000"
                    value={price}
                    onChange={handlePriceChange}
                    required
                    min={100}
                    max={100000}
                  />
                  <Input
                    type="number"
                    label="Количество мест"
                    placeholder="5"
                    value={spots}
                    onChange={handleSpotsChange}
                    required
                    min={1}
                    max={1000}
                  />
                  <div className={styles.formRow}>
                    <Input
                      label="Район"
                      placeholder="ЦАО"
                      value={district}
                      onChange={handleDistrictChange}
                    />
                    <Input
                      label="Метро"
                      placeholder="Площадь Революции"
                      value={metro}
                      onChange={handleMetroChange}
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label className={styles.label}>Тип парковки</label>
                    <select 
                      className={styles.select}
                      value={parkingType}
                      onChange={handleParkingTypeChange}
                    >
                      <option value="">Выберите тип</option>
                      <option value="ground">Наземная</option>
                      <option value="underground">Подземная</option>
                      <option value="roof">На крыше</option>
                      <option value="covered">Крытая</option>
                    </select>
                  </div>
                  <Textarea
                    label="Описание (необязательно)"
                    placeholder="Дополнительная информация о парковке..."
                    value={description}
                    onChange={handleDescriptionChange}
                    maxLength={500}
                  />
                  <div className={styles.imageUpload}>
                    <label className={styles.imageLabel}>Фото парковки</label>
                    <div className={styles.imageUploadArea}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className={styles.fileInput}
                        id="parking-image"
                      />
                      <label htmlFor="parking-image" className={styles.fileLabel}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        <span>Выбрать фото</span>
                      </label>
                      <span className={styles.imageHint}>или перетащите файл</span>
                    </div>
                    {imagePreview && (
                      <div className={styles.imagePreview}>
                        <img src={imagePreview} alt="Превью" className={styles.previewImage} />
                        <button type="button" onClick={removeImage} className={styles.removeImage}>
                          Удалить
                        </button>
                      </div>
                    )}
                  </div>
                  <div className={styles.formActions}>
                    <Button type="submit" variant="primary">
                      Добавить парковку
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setActiveTab('parkings')}>
                      Отмена
                    </Button>
                  </div>
                </form>
              </>
            )}

            {activeTab === 'history' && (
              <>
                <div className={styles.contentHeader}>
                  <h1 className={styles.contentTitle}>История аренд</h1>
                </div>
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>📋</div>
                  <p>История пуста</p>
                  <p>Здесь будут отображаться ваши аренды</p>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}