<script setup lang="ts">
import { ref } from 'vue'
import { useConfigStore } from '@/stores/config'
import { uploadImage } from '@/services/uploads'
import MediaPicker from '@/components/common/MediaPicker.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const store = useConfigStore()

const title = ref(store.appConfig.title)
const theme = ref(store.appConfig.theme)
const fontSize = ref(store.appConfig.fontSize ?? 100)
const footerText = ref(store.appConfig.footerText ?? '© 2026 OSDuo Tech, Bengaluru')
const showFooter = ref(store.appConfig.showFooter ?? true)
const logoUrl = ref(store.appConfig.logoUrl ?? '')
const showLogo = ref(store.appConfig.showLogo ?? false)
const showLibrary = ref(false)

const emit = defineEmits<{
  (e: 'close'): void
}>()

function save() {
  store.updateAppConfig({
    title: title.value.trim(),
    theme: theme.value,
    fontSize: fontSize.value,
    footerText: footerText.value,
    showFooter: showFooter.value,
    logoUrl: logoUrl.value,
    showLogo: showLogo.value
  })
  emit('close')
}

function cancel() {
  emit('close')
}

function resetFontSize() {
  fontSize.value = 100
}

async function handleLogoUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  if (file.size > 500 * 1024) {
    alert('Image too large. Please use an image under 500KB.')
    return
  }

  try {
    const up = await uploadImage(file)
    logoUrl.value = up.url
  } catch {
    alert('Upload failed. Unsupported format or server error.')
  }
}

function onLogoSelected(value: string) {
  logoUrl.value = value
  showLibrary.value = false
}
</script>

<template>
  <div class="modal-overlay" @click="cancel">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>App Settings</h3>
        <button class="close-btn" @click="cancel"><AppIcon name="close" :size="18" /></button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Dashboard Title</label>
          <input
            v-model="title"
            type="text"
            class="form-input"
            placeholder="Enter dashboard title"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Theme</label>
          <select v-model="theme" class="form-select">
            <option value="dark-navy">Dark Navy</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="auto">Auto (System)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">
            Font Size: {{ fontSize }}%
          </label>
          <div class="font-size-control">
            <input
              v-model.number="fontSize"
              type="range"
              min="75"
              max="150"
              step="5"
              class="form-range"
            />
            <div class="range-labels">
              <span>75%</span>
              <span>100%</span>
              <span>125%</span>
              <span>150%</span>
            </div>
            <button class="btn btn-small btn-reset" @click="resetFontSize">
              Reset to 100%
            </button>
          </div>
          <p class="form-hint">
            Adjusts the base font size for the entire dashboard
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">Logo</label>
          <div class="logo-control">
            <label class="checkbox-label">
              <input v-model="showLogo" type="checkbox" />
              <span>Show logo in header</span>
            </label>
            <div v-if="showLogo" class="logo-upload">
              <img v-if="logoUrl" :src="logoUrl" class="logo-preview" alt="Logo" />
              <label class="btn btn-small btn-upload">
                Upload Logo
                <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" @change="handleLogoUpload" hidden />
              </label>
              <button type="button" class="btn btn-small btn-upload" @click="showLibrary = !showLibrary">
                {{ showLibrary ? 'Close Library' : 'Choose from Library' }}
              </button>
              <button v-if="logoUrl" class="btn btn-small btn-danger" @click="logoUrl = ''">
                Remove
              </button>
            </div>
            <div v-if="showLibrary" class="logo-library">
              <MediaPicker :model-value="logoUrl" :max-size-mb="0.5" @update:model-value="onLogoSelected" />
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Footer</label>
          <div class="footer-control">
            <label class="checkbox-label">
              <input v-model="showFooter" type="checkbox" />
              <span>Show footer</span>
            </label>
            <input
              v-if="showFooter"
              v-model="footerText"
              type="text"
              class="form-input"
              placeholder="Footer text"
              style="margin-top: 0.5rem"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Preview</label>
          <div class="preview-box" :style="{ fontSize: fontSize + '%' }">
            <p>Sample text at {{ fontSize }}% font size</p>
            <p class="preview-small">Small text sample</p>
            <p class="preview-large">Large text sample</p>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="cancel">Cancel</button>
        <button class="btn btn-primary" @click="save">Save Settings</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);

  h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text);
  }
}

.close-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;

  &:hover {
    color: var(--color-text);
  }
}

.modal-body {
  padding: 1.25rem;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-dim);
  }
}

.font-size-control {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-range {
  width: 100%;
  margin: 0.5rem 0;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.btn-reset {
  align-self: flex-start;
  margin-top: 0.25rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
}

.form-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.375rem;
}

.preview-box {
  padding: 1rem;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;

  p {
    margin: 0.5rem 0;
    color: var(--color-text);
  }

  .preview-small {
    font-size: 0.75em;
    color: var(--color-text-muted);
  }

  .preview-large {
    font-size: 1.25em;
    font-weight: 600;
  }
}

.logo-control,
.footer-control {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text);
  cursor: pointer;

  input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    cursor: pointer;
  }
}

.logo-upload {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.75rem;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.logo-preview {
  max-height: 40px;
  max-width: 150px;
  object-fit: contain;
}

.logo-library {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.btn-upload {
  background-color: var(--color-bg-hover);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  cursor: pointer;
}

.btn-danger {
  background-color: var(--color-danger);
  color: white;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: #b91c1c;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-border);
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;

  &.btn-primary {
    background-color: var(--color-primary);
    color: white;
    border: none;

    &:hover {
      background-color: var(--color-primary-hover);
    }
  }

  &.btn-secondary {
    background-color: var(--color-bg);
    color: var(--color-text);
    border: 1px solid var(--color-border);

    &:hover {
      border-color: var(--color-border-hover);
      background-color: var(--color-bg-hover);
    }
  }

  &.btn-small {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
  }
}
</style>
