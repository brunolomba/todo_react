import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Download, Upload } from 'lucide-react';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoList {
  id: string;
  name: string;
  items: TodoItem[];
}

interface AppData {
  lists: TodoList[];
  selectedListId: string;
  moveCompletedToEnd: boolean;
  hideCompleted: boolean;
}

export default function TodoApp() {
  const [lists, setLists] = useState<TodoList[]>([]);
  const [selectedListId, setSelectedListId] = useState('');
  const [newItemText, setNewItemText] = useState('');
  const [newListName, setNewListName] = useState('');
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [moveCompletedToEnd, setMoveCompletedToEnd] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);

  // Carregar dados quando o componente inicializa
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('todoAppData');
      if (savedData) {
        const data: AppData = JSON.parse(savedData);
        setLists(data.lists);
        setSelectedListId(data.selectedListId);
        setMoveCompletedToEnd(data.moveCompletedToEnd);
        setHideCompleted(data.hideCompleted);
      } else {
        // Dados iniciais se não houver dados salvos
        const initialData = {
          lists: [{
            id: '1',
            name: 'Lista Principal',
            items: [
              { id: '1', text: 'Estudar React', completed: false },
              { id: '2', text: 'Fazer exercícios', completed: true },
              { id: '3', text: 'Ler um livro', completed: false }
            ]
          }],
          selectedListId: '1',
          moveCompletedToEnd: false,
          hideCompleted: false
        };
        setLists(initialData.lists);
        setSelectedListId(initialData.selectedListId);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }, []);

  // Salvar dados sempre que houver mudanças
  useEffect(() => {
    if (lists.length > 0) { // Só salva se houver dados
      const dataToSave: AppData = {
        lists,
        selectedListId,
        moveCompletedToEnd,
        hideCompleted
      };
      localStorage.setItem('todoAppData', JSON.stringify(dataToSave));
    }
  }, [lists, selectedListId, moveCompletedToEnd, hideCompleted]);

  const selectedList = lists.find(list => list.id === selectedListId);

  const { incompleteItems, completedItems, allItemsSorted } = useMemo(() => {
    if (!selectedList) return { incompleteItems: [], completedItems: [], allItemsSorted: [] };
    
    const incomplete = selectedList.items.filter(item => !item.completed);
    const completed = selectedList.items.filter(item => item.completed);
    
    incomplete.sort((a, b) => a.text.toLowerCase().localeCompare(b.text.toLowerCase()));
    completed.sort((a, b) => a.text.toLowerCase().localeCompare(b.text.toLowerCase()));
    
    const allSorted = [...selectedList.items].sort((a, b) => 
      a.text.toLowerCase().localeCompare(b.text.toLowerCase())
    );
    
    return { incompleteItems: incomplete, completedItems: completed, allItemsSorted: allSorted };
  }, [selectedList]);

  // Função para exportar dados
  const exportData = () => {
    const dataToExport: AppData = {
      lists,
      selectedListId,
      moveCompletedToEnd,
      hideCompleted
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `tarefas-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  // Função para importar dados
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData: AppData = JSON.parse(e.target?.result as string);
        setLists(importedData.lists);
        setSelectedListId(importedData.selectedListId);
        setMoveCompletedToEnd(importedData.moveCompletedToEnd);
        setHideCompleted(importedData.hideCompleted);
        alert('Dados importados com sucesso!');
      } catch (error) {
        alert('Erro ao importar arquivo. Verifique se é um arquivo válido.');
      }
    };
    reader.readAsText(file);
    
    // Limpar o input
    event.target.value = '';
  };

  const addNewList = () => {
    if (newListName.trim()) {
      const newList: TodoList = {
        id: Date.now().toString(),
        name: newListName.trim(),
        items: []
      };
      setLists([...lists, newList]);
      setSelectedListId(newList.id);
      setNewListName('');
      setShowNewListInput(false);
    }
  };

  const addItem = () => {
    if (newItemText.trim() && selectedList) {
      const newItem: TodoItem = {
        id: Date.now().toString(),
        text: newItemText.trim(),
        completed: false
      };
      
      setLists(lists.map(list => 
        list.id === selectedListId 
          ? { ...list, items: [...list.items, newItem] }
          : list
      ));
      setNewItemText('');
    }
  };

  const toggleItem = (itemId: string) => {
    setLists(lists.map(list => 
      list.id === selectedListId 
        ? {
            ...list, 
            items: list.items.map(item => 
              item.id === itemId 
                ? { ...item, completed: !item.completed }
                : item
            )
          }
        : list
    ));
  };

  const deleteItem = (itemId: string) => {
    setLists(lists.map(list => 
      list.id === selectedListId 
        ? { ...list, items: list.items.filter(item => item.id !== itemId) }
        : list
    ));
  };

  const deleteList = (listIdToDelete: string) => {
    const listToDelete = lists.find(l => l.id === listIdToDelete);
    if (!listToDelete) return;

    const confirmed = window.confirm(`Deseja remover a lista "${listToDelete.name}"?`);
    if (confirmed) {
      const remainingLists = lists.filter(list => list.id !== listIdToDelete);
      
      if (selectedListId === listIdToDelete && remainingLists.length > 0) {
        setSelectedListId(remainingLists[0].id);
      }
      
      setLists(remainingLists);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-4 p-4 bg-white rounded-lg shadow-lg min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Lista de Tarefas</h1>
        
        {/* Botões de Backup */}
        <div className="flex gap-2 mb-4 bg-blue-50 rounded-md">
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors flex-1"
          >
            <Download size={16} />
            Exportar
          </button>
          
          <label className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors cursor-pointer flex-1">
            <Upload size={16} />
            Importar
            <input
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
            />
          </label>
        </div>
        
        {/* Seletor de Lista + Botões */}
        <div className="flex gap-2 mb-4">
          <select 
            value={selectedListId} 
            onChange={(e) => setSelectedListId(e.target.value)}
            className="flex-1 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
          >
            {lists.map(list => (
              <option key={list.id} value={list.id}>{list.name}</option>
            ))}
          </select>
          
          <button
            onClick={() => setShowNewListInput(!showNewListInput)}
            className="w-10 h-10 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center transition-colors"
            title="Adicionar nova lista"
          >
            <Plus size={20} />
          </button>
          
          {lists.length > 1 && (
            <button
              onClick={() => deleteList(selectedListId)}
              className="w-10 h-10 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center justify-center transition-colors"
              title="Deletar lista atual"
            >
              ✕
            </button>
          )}
        </div>

        {/* Input para Nova Lista */}
        {showNewListInput && (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Nome da nova lista"
              className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && addNewList()}
              autoFocus
            />
            <button
              onClick={addNewList}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Criar
            </button>
          </div>
        )}

        {/* Configurações */}
        <div className="flex flex-col gap-2 mb-4 p-3 bg-gray-50 rounded-md">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={moveCompletedToEnd}
              onChange={(e) => setMoveCompletedToEnd(e.target.checked)}
              className="rounded"
            />
            Separar Concluídas
          </label>
          
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
              className="rounded"
            />
            Ocultar Concluídas
          </label>
        </div>

        {/* Input para Novo Item */}
        <div className="flex items-center gap-3 p-3 mt-4 bg-gray-50 rounded-md">
          <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Adicionar nova tarefa..."
            className="flex-1 py-2 border-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent"
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
          />
          <button
            onClick={addItem}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Lista de Itens */}
      <div className="space-y-2 mt-4">
        {selectedList?.items.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhuma tarefa ainda. Adicione uma acima!</p>
        ) : (
          <>
            {!moveCompletedToEnd && allItemsSorted.map(item => {
              if (hideCompleted && item.completed) return null;
              
              return (
                <div 
                  key={item.id} 
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors group"
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      item.completed 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {item.completed && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </button>
                  
                  <span className={`flex-1 transition-all ${
                    item.completed 
                      ? 'line-through text-gray-500' 
                      : 'text-gray-800'
                  }`}>
                    {item.text}
                  </span>
                  
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all p-1"
                  >
                    ✕
                  </button>
                </div>
              );
            })}

            {moveCompletedToEnd && (
              <>
                {incompleteItems.length > 0 && (
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Tarefas em aberto ({incompleteItems.length})
                  </h3>
                )}
                
                {incompleteItems.map(item => (
                  <div 
                    key={item.id} 
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors group"
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-blue-400 flex items-center justify-center transition-all"
                    >
                    </button>
                    
                    <span className="flex-1 text-gray-800">
                      {item.text}
                    </span>
                    
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {moveCompletedToEnd && !hideCompleted && completedItems.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Concluídas ({completedItems.length})
            </h3>
            {completedItems.map(item => (
              <div 
                key={item.id} 
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors group"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-6 h-6 rounded-full border-2 bg-blue-500 border-blue-500 flex items-center justify-center transition-all"
                >
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </button>
                
                <span className="flex-1 line-through text-gray-500">
                  {item.text}
                </span>
                
                <button
                  onClick={() => deleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all p-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Estatísticas */}
      {selectedList && (
        <div className="mt-6 text-sm text-gray-600 text-center p-3 bg-gray-50 rounded-md">
          {selectedList.items.filter(item => item.completed).length} de {selectedList.items.length} tarefas concluídas
          <div className="text-xs text-gray-500 mt-1">
            💾 Dados salvos automaticamente
          </div>
        </div>
      )}
    </div>
  );
}