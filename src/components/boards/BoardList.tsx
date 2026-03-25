// src/components/boards/BoardList.tsx
import React, { useState } from 'react';
import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react';
import { colors, spacing, layout } from '../../styles/design-system';
import { StyledButton, StyledInput, StyledCard, StyledModal, StyledText, StyledBadge } from '../ui/StyledComponents';
import { useBoardStore } from '../../store/boardStore';
import { BOARD_TEMPLATES } from '../../constants/boardTemplates';
import { TemplatePreview } from './TemplatePreview';

export const BoardList = () => {
  const { 
    boards, 
    currentBoardId, 
    selectBoard, 
    createBoard, 
    deleteBoard, 
    renameBoard 
  } = useBoardStore();
  
  const [newBoardName, setNewBoardName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(BOARD_TEMPLATES[0]);
  const [editingBoard, setEditingBoard] = useState(null as { id: string; name: string } | null);
  const [deletingBoard, setDeletingBoard] = useState(null as string | null);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleCreateBoard = async () => {
    if (newBoardName.trim()) {
      await createBoard(newBoardName.trim(), selectedTemplate);
      setNewBoardName('');
      setSelectedTemplate(BOARD_TEMPLATES[0]);
      setIsCreateOpen(false);
    }
  };

  const handleEditBoard = (board: { id: string; name: string }) => {
    setEditingBoard(board);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editingBoard && editingBoard.name.trim()) {
      await renameBoard(editingBoard.id, editingBoard.name.trim());
      setEditingBoard(null);
      setIsEditOpen(false);
    }
  };

  const handleDeleteBoard = (boardId: string) => {
    setDeletingBoard(boardId);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingBoard) {
      await deleteBoard(deletingBoard);
      setDeletingBoard(null);
      setIsDeleteOpen(false);
    }
  };

  const sidebarStyle: React.CSSProperties = {
    height: '100vh',
    width: layout.sidebar.width,
    backgroundColor: layout.sidebar.backgroundColor,
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: layout.sidebar.borderColor,
    padding: spacing[6],
    overflow: 'auto',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[6],
  };

  const emptyStateStyle = {
    textAlign: 'center' as const,
    padding: spacing[12],
    borderWidth: '2px',
    borderStyle: 'dashed',
    borderColor: colors.gray[300],
    borderRadius: '12px',
    backgroundColor: colors.gray[50],
  };

  return (
    <div style={sidebarStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <StyledText as="h1" size="xl" weight="bold" color={colors.gray[900]}>
          Boards
        </StyledText>
        <StyledButton
          variant="primary"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
        >
          + New
        </StyledButton>
      </div>

      {/* Boards list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
        {boards.length === 0 ? (
          <div style={emptyStateStyle}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: colors.gray[200],
              borderRadius: '12px',
              margin: `0 auto ${spacing[4]}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}>
              📋
            </div>
            <StyledText size="base" weight="medium" color={colors.gray[700]} style={{ marginBottom: spacing[2] }}>
              No boards yet
            </StyledText>
            <StyledText size="sm" color={colors.gray[500]} style={{ marginBottom: spacing[4] }}>
              Create your first whiteboard to get started
            </StyledText>
            <StyledButton
              variant="primary"
              onClick={() => setIsCreateOpen(true)}
            >
              Create your first board
            </StyledButton>
          </div>
        ) : (
          boards.map((board: { id: string; name: string; elements: any[] }) => (
            <StyledCard
              key={board.id}
              interactive
              hover
              onClick={() => selectBoard(board.id)}
              style={{
                padding: spacing[4],
                backgroundColor: currentBoardId === board.id ? colors.primary[50] : colors.white,
                borderColor: currentBoardId === board.id ? colors.primary[200] : colors.gray[200],
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <StyledText 
                    size="base" 
                    weight={currentBoardId === board.id ? 'semibold' : 'medium'}
                    color={currentBoardId === board.id ? colors.primary[800] : colors.gray[800]}
                    style={{ marginBottom: spacing[1] }}
                  >
                    {board.name}
                  </StyledText>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                    <StyledBadge variant="default" size="sm">
                      {board.elements.length} elements
                    </StyledBadge>
                    {currentBoardId === board.id && (
                      <StyledBadge variant="success" size="sm">
                        Active
                      </StyledBadge>
                    )}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: spacing[1], marginLeft: spacing[2] }}>
                  <StyledButton
                    variant="ghost"
                    size="xs"
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation();
                      handleEditBoard(board);
                    }}
                    title="Rename board"
                  >
                    Rename
                  </StyledButton>
                  <StyledButton
                    variant="ghost"
                    size="xs"
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation();
                      handleDeleteBoard(board.id);
                    }}
                    title="Delete board"
                    style={{ color: colors.error[600] }}
                  >
                    Delete
                  </StyledButton>
                </div>
              </div>
            </StyledCard>
          ))
        )}
      </div>

      {/* Create board modal */}
      <StyledModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Board"
        footer={
          <div style={{ display: 'flex', gap: spacing[3] }}>
            <StyledButton variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </StyledButton>
            <StyledButton 
              variant="primary" 
              onClick={handleCreateBoard} 
              disabled={!newBoardName.trim()}
            >
              Create Board
            </StyledButton>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
          <StyledInput
            label="Board Name"
            placeholder="Enter board name..."
            value={newBoardName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewBoardName(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleCreateBoard()}
            autoFocus
          />
          
          <div>
            <StyledText 
              size="sm" 
              weight="medium" 
              color={colors.gray[700]} 
              style={{ marginBottom: spacing[3] }}
            >
              Choose a template:
            </StyledText>
            
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', 
                gap: spacing[3],
                maxHeight: '200px',
                overflowY: 'auto',
              }}
            >
              {BOARD_TEMPLATES.map((template) => (
                <div key={template.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing[2] }}>
                  <TemplatePreview
                    template={template}
                    size="medium"
                    selected={selectedTemplate.id === template.id}
                    onClick={() => setSelectedTemplate(template)}
                  />
                  <StyledText 
                    size="xs" 
                    color={colors.gray[600]}
                    style={{ textAlign: 'center', maxWidth: '80px' }}
                  >
                    {template.name}
                  </StyledText>
                </div>
              ))}
            </div>
          </div>
        </div>
      </StyledModal>

      {/* Edit board modal */}
      <StyledModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Rename Board"
        footer={
          <div style={{ display: 'flex', gap: spacing[3] }}>
            <StyledButton variant="ghost" onClick={() => setIsEditOpen(false)}>
              Cancel
            </StyledButton>
            <StyledButton 
              variant="primary" 
              onClick={handleSaveEdit} 
              disabled={!editingBoard || !editingBoard.name.trim()}
            >
              Save Changes
            </StyledButton>
          </div>
        }
      >
        <StyledInput
          label="Board Name"
          placeholder="Enter board name..."
          value={editingBoard?.name || ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingBoard((prev: { id: string; name: string } | null) => 
            prev ? { ...prev, name: e.target.value } : null
          )}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSaveEdit()}
          autoFocus
        />
      </StyledModal>

      {/* Delete confirmation modal */}
      <StyledModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Board"
        footer={
          <div style={{ display: 'flex', gap: spacing[3] }}>
            <StyledButton variant="ghost" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </StyledButton>
            <StyledButton variant="danger" onClick={confirmDelete}>
              Delete Board
            </StyledButton>
          </div>
        }
      >
        <div style={{ 
          padding: spacing[4], 
          backgroundColor: colors.warning[50], 
          borderRadius: '8px',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: colors.warning[200],
        }}>
          <StyledText weight="medium" color={colors.warning[800]} style={{ marginBottom: spacing[2] }}>
            ⚠️ This action cannot be undone
          </StyledText>
          <StyledText size="sm" color={colors.warning[700]}>
            All elements in this board will be permanently deleted. Are you sure you want to continue?
          </StyledText>
        </div>
      </StyledModal>
    </div>
  );
};
