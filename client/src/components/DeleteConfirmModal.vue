<template>
  <div class="modal-backdrop" v-if="show">
    <div class="modal-content">
      <h2>Xác nhận xóa</h2>
      <p>Bạn có chắc chắn muốn xóa file "{{ fileName }}" không?</p>
      <div class="modal-actions">
        <button @click="confirmDelete" class="action-button delete-button">Xóa</button>
        <button @click="$emit('close')" class="action-button cancel-button">Hủy</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DeleteConfirmModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    fileName: {
      type: String,
      required: true
    }
  },
  methods: {
    confirmDelete() {
      this.$emit('confirm');
    }
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
}

.modal-content h2 {
  margin-bottom: 10px;
}

.modal-content p {
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.action-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.delete-button {
  background-color: var(--danger-color);
  color: white;
}

.delete-button:hover {
  background-color: #c0392b;
}

.cancel-button {
  background-color: #95a5a6;
  color: white;
}

.cancel-button:hover {
  background-color: #7f8c8d;
}
</style> 