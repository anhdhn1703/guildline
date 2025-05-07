import { createStore } from 'vuex'
import axios from 'axios'

export default createStore({
  state: {
    files: [],
    currentFile: null,
    markdownContent: '',
    markdownHtml: '',
    headings: []
  },
  getters: {
    getFiles: state => state.files,
    getCurrentFile: state => state.currentFile,
    getMarkdownContent: state => state.markdownContent,
    getMarkdownHtml: state => state.markdownHtml,
    getHeadings: state => state.headings
  },
  mutations: {
    SET_FILES(state, files) {
      state.files = files
    },
    SET_CURRENT_FILE(state, fileName) {
      state.currentFile = fileName
    },
    SET_MARKDOWN_CONTENT(state, content) {
      state.markdownContent = content
    },
    SET_MARKDOWN_HTML(state, html) {
      state.markdownHtml = html
    },
    SET_HEADINGS(state, headings) {
      state.headings = headings
    }
  },
  actions: {
    async fetchFiles({ commit }) {
      try {
        const response = await axios.get('/api/files')
        commit('SET_FILES', response.data)
        return response.data
      } catch (error) {
        console.error('Lỗi khi tải danh sách file:', error)
        throw error
      }
    },
    async loadFile({ commit }, fileName) {
      try {
        const response = await axios.get(`/api/files/${fileName}`)
        commit('SET_CURRENT_FILE', fileName)
        commit('SET_MARKDOWN_CONTENT', response.data.content)
        commit('SET_MARKDOWN_HTML', response.data.html)
        return response.data
      } catch (error) {
        console.error('Lỗi khi tải file:', error)
        throw error
      }
    },
    async saveFile({ state, commit }, content) {
      if (!state.currentFile) return

      try {
        await axios.put(`/api/files/${state.currentFile}`, { content })
        commit('SET_MARKDOWN_CONTENT', content)
        return true
      } catch (error) {
        console.error('Lỗi khi lưu file:', error)
        throw error
      }
    },
    async createFile({ dispatch }, { name, content }) {
      try {
        await axios.post('/api/files', { name, content })
        await dispatch('fetchFiles')
        await dispatch('loadFile', name)
        return true
      } catch (error) {
        console.error('Lỗi khi tạo file:', error)
        throw error
      }
    },
    async deleteFile({ state, commit, dispatch }, fileName) {
      try {
        await axios.delete(`/api/files/${fileName}`)
        
        // Nếu file đang xóa là file hiện tại, reset state
        if (state.currentFile === fileName) {
          commit('SET_CURRENT_FILE', null)
          commit('SET_MARKDOWN_CONTENT', '')
          commit('SET_MARKDOWN_HTML', '')
          commit('SET_HEADINGS', [])
        }
        
        await dispatch('fetchFiles')
        return true
      } catch (error) {
        console.error('Lỗi khi xóa file:', error)
        throw error
      }
    },
    setHeadings({ commit }, headings) {
      commit('SET_HEADINGS', headings)
    }
  }
}) 