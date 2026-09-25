import { useCallback, useEffect, useState } from 'react';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import {
  createChatbotFaq,
  deleteChatbotFaq,
  fetchAllChatbotFaqs,
  fetchChatbotConfig,
  updateChatbotConfig,
  updateChatbotFaq,
} from '../../../services/chatbotService';
import './admin-chatbot.css';

const emptyFaq = { label: '', prompt: '', category: 'General', displayOrder: 0, enabled: true };

export default function AdminChatbot() {
  const { userToken } = useAuthContext();
  const { addToast } = useToast();
  const [config, setConfig] = useState({ systemInstruction: '', offTopicResponse: '' });
  const [faqs, setFaqs] = useState([]);
  const [faqForm, setFaqForm] = useState(emptyFaq);
  const [editingFaqId, setEditingFaqId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingFaq, setSavingFaq] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = useCallback(() => {
    Promise.all([
      fetchChatbotConfig(),
      fetchAllChatbotFaqs(userToken),
    ]).then(([configData, faqData]) => {
      if (configData) {
        setConfig({
          systemInstruction: configData.systemInstruction || '',
          offTopicResponse: configData.offTopicResponse || '',
        });
      }
      if (Array.isArray(faqData)) setFaqs(faqData);
    }).catch((error) => {
      addToast(`Failed to load chatbot settings: ${error.message}`, 'error');
    }).finally(() => setLoading(false));
  }, [addToast, userToken]);

  useEffect(() => {
    if (userToken) loadData();
  }, [loadData, userToken]);

  const handleConfigSubmit = (event) => {
    event.preventDefault();
    updateChatbotConfig(userToken, config, () => {
      addToast('Chatbot instructions updated successfully', 'success');
    }, (error) => {
      addToast(`Failed to update chatbot instructions: ${error.message}`, 'error');
    }, setSavingConfig);
  };

  const handleFaqSubmit = (event) => {
    event.preventDefault();
    const save = editingFaqId
      ? updateChatbotFaq(userToken, editingFaqId, faqForm, () => {
        addToast('FAQ updated successfully', 'success');
        resetFaqForm();
        loadData();
      }, (error) => addToast(`Failed to update FAQ: ${error.message}`, 'error'), setSavingFaq)
      : createChatbotFaq(userToken, faqForm, () => {
        addToast('FAQ added successfully', 'success');
        resetFaqForm();
        loadData();
      }, (error) => addToast(`Failed to add FAQ: ${error.message}`, 'error'), setSavingFaq);
    return save;
  };

  const resetFaqForm = () => {
    setFaqForm(emptyFaq);
    setEditingFaqId(null);
  };

  const handleEdit = (faq) => {
    setEditingFaqId(faq.id);
    setFaqForm({
      label: faq.label || '',
      prompt: faq.prompt || '',
      category: faq.category || 'General',
      displayOrder: faq.displayOrder || 0,
      enabled: faq.enabled !== false,
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteChatbotFaq(userToken, deleteTarget.id, () => {
      addToast('FAQ deleted successfully', 'success');
      setDeleteTarget(null);
      loadData();
    }, (error) => addToast(`Failed to delete FAQ: ${error.message}`, 'error'), setSavingFaq);
  };

  const filteredFaqs = faqs.filter((faq) => {
    const query = searchTerm.toLowerCase();
    return !query || `${faq.label} ${faq.prompt} ${faq.category}`.toLowerCase().includes(query);
  });

  return (
    <main className="admin-chatbot-page page-fade-in">
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/admin' }, { label: 'Chatbot' }]} />
      <PageHeader
        title="Chatbot Management"
        subtitle="Manage the assistant instructions and public quick-access questions"
        illustrationSrc="/pageImages/admin/quick-links.png"
      />

      <section className="card admin-chatbot-panel">
        <div className="admin-chatbot-section-heading">
          <div>
            <h2><i className="fa-solid fa-sliders"></i> Assistant Instructions</h2>
            <p>These instructions guide the assistant while live service data remains authoritative.</p>
          </div>
        </div>
        <form className="admin-chatbot-form" onSubmit={handleConfigSubmit}>
          <label className="formGroup">
            <span className="form-label">System instruction *</span>
            <textarea
              value={config.systemInstruction}
              onChange={(event) => setConfig({ ...config, systemInstruction: event.target.value })}
              rows={7}
              required
              disabled={loading || savingConfig}
            />
          </label>
          <label className="formGroup">
            <span className="form-label">Off-topic response *</span>
            <textarea
              value={config.offTopicResponse}
              onChange={(event) => setConfig({ ...config, offTopicResponse: event.target.value })}
              rows={3}
              required
              disabled={loading || savingConfig}
            />
          </label>
          <button className="btn-primary" type="submit" disabled={loading || savingConfig}>
            <i className={savingConfig ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'}></i>
            {savingConfig ? 'Saving...' : 'Save Instructions'}
          </button>
        </form>
      </section>

      <section className="card admin-chatbot-panel">
        <div className="admin-chatbot-section-heading admin-chatbot-faq-heading">
          <div>
            <h2><i className="fa-solid fa-comments"></i> Quick FAQ Prompts</h2>
            <p>Visitors can click enabled prompts in the public chatbot to start a conversation.</p>
          </div>
          <span className="admin-chatbot-count">{faqs.length} prompts</span>
        </div>

        <form className="admin-chatbot-faq-form" onSubmit={handleFaqSubmit}>
          <h3>{editingFaqId ? 'Edit FAQ Prompt' : 'Add FAQ Prompt'}</h3>
          <div className="admin-chatbot-form-grid">
            <label className="formGroup">
              <span className="form-label">Button label *</span>
              <input value={faqForm.label} onChange={(event) => setFaqForm({ ...faqForm, label: event.target.value })} required disabled={savingFaq} placeholder="e.g., What services do you offer?" />
            </label>
            <label className="formGroup">
              <span className="form-label">Category *</span>
              <input value={faqForm.category} onChange={(event) => setFaqForm({ ...faqForm, category: event.target.value })} required disabled={savingFaq} placeholder="Services" />
            </label>
            <label className="formGroup">
              <span className="form-label">Display order</span>
              <input type="number" min="0" value={faqForm.displayOrder} onChange={(event) => setFaqForm({ ...faqForm, displayOrder: Number(event.target.value) })} disabled={savingFaq} />
            </label>
            <label className="admin-chatbot-checkbox">
              <input type="checkbox" checked={faqForm.enabled} onChange={(event) => setFaqForm({ ...faqForm, enabled: event.target.checked })} disabled={savingFaq} />
              <span>Visible in public chatbot</span>
            </label>
          </div>
          <label className="formGroup">
            <span className="form-label">Prompt sent to the assistant *</span>
            <textarea value={faqForm.prompt} onChange={(event) => setFaqForm({ ...faqForm, prompt: event.target.value })} rows={3} required disabled={savingFaq} placeholder="What services does Fairfly currently offer?" />
          </label>
          <div className="admin-chatbot-form-actions">
            <button className="btn-primary" type="submit" disabled={savingFaq}>
              <i className={savingFaq ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-plus'}></i>
              {savingFaq ? 'Saving...' : editingFaqId ? 'Update FAQ' : 'Add FAQ'}
            </button>
            {editingFaqId && <button className="btn-secondary" type="button" onClick={resetFaqForm} disabled={savingFaq}>Cancel Edit</button>}
          </div>
        </form>

        <div className="admin-chatbot-list-toolbar">
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search FAQ prompts..." aria-label="Search FAQ prompts" />
        </div>
        {loading ? <p className="admin-chatbot-empty">Loading chatbot settings...</p> : filteredFaqs.length === 0 ? <p className="admin-chatbot-empty">No FAQ prompts found.</p> : (
          <div className="admin-chatbot-table-wrap">
            <table className="admin-chatbot-table">
              <thead><tr><th>Order</th><th>Question</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredFaqs.map((faq) => (
                  <tr key={faq.id}>
                    <td>{faq.displayOrder}</td>
                    <td><strong>{faq.label}</strong><small>{faq.prompt}</small></td>
                    <td>{faq.category}</td>
                    <td><span className={`admin-chatbot-status ${faq.enabled ? 'is-enabled' : 'is-disabled'}`}>{faq.enabled ? 'Enabled' : 'Disabled'}</span></td>
                    <td className="admin-chatbot-actions">
                      <button className="icon-btn edit" type="button" title="Edit FAQ" onClick={() => handleEdit(faq)}><i className="fa-solid fa-pen-to-square"></i></button>
                      <button className="icon-btn delete" type="button" title="Delete FAQ" onClick={() => setDeleteTarget(faq)}><i className="fa-solid fa-trash"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => !savingFaq && setDeleteTarget(null)}
        Icon={() => <i className="fa-solid fa-trash-can"></i>}
        Title="Delete FAQ prompt?"
        Desc={`"${deleteTarget?.label || ''}" will be permanently removed.`}
        BtnColor="var(--error-red)"
        confirmText="Delete"
        isLoading={savingFaq}
        OnConfirm={handleDelete}
      />
    </main>
  );
}
