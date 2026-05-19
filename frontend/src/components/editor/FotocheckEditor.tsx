import { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { Button, Spinner } from '../components/ui';
import './FotocheckEditor.css';

interface FotocheckEditorProps {
  width?: number;
  height?: number;
  initialPhoto?: string;
  template?: 'horizontal' | 'vertical';
  onSave?: (imageData: string) => void;
  onCancel?: () => void;
}

const TEMPLATES = {
  horizontal: { width: 400, height: 250 },
  vertical: { width: 300, height: 450 },
};

export const FotocheckEditor = ({ 
  width = 400, 
  height = 250, 
  initialPhoto, 
  template = 'horizontal',
  onSave,
  onCancel 
}: FotocheckEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);

  const initCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
      selection: true,
    });

    const templateConfig = TEMPLATES[template];
    const border = new fabric.Rect({
      left: 10,
      top: 10,
      width: templateConfig.width - 20,
      height: templateConfig.height - 20,
      fill: 'transparent',
      stroke: '#333',
      strokeWidth: 2,
      selectable: false,
      evented: false,
    });

    const titleText = new fabric.IText('FOTOCHECK', {
      left: 20,
      top: 20,
      fontSize: 18,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      selectable: false,
      evented: false,
    });

    const nameText = new fabric.IText('Nombre Completo', {
      left: 20,
      top: template === 'horizontal' ? 80 : 150,
      fontSize: 16,
      fontFamily: 'Arial',
      fill: '#333',
      selectable: true,
    });
    nameText.set('id', 'name');

    const cargoText = new fabric.IText('Cargo / Departamento', {
      left: 20,
      top: template === 'horizontal' ? 110 : 190,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#666',
      selectable: true,
    });
    cargoText.set('id', 'cargo');

    if (template === 'horizontal') {
      const photoPlaceholder = new fabric.Rect({
        left: 280,
        top: 60,
        width: 100,
        height: 120,
        fill: '#f0f0f0',
        stroke: '#ccc',
        strokeWidth: 1,
        selectable: true,
      });
      photoPlaceholder.set('id', 'photo');
      canvas.add(border, titleText, nameText, cargoText, photoPlaceholder);
    } else {
      const photoPlaceholder = new fabric.Rect({
        left: 75,
        top: 60,
        width: 150,
        height: 150,
        fill: '#f0f0f0',
        stroke: '#ccc',
        strokeWidth: 1,
        selectable: true,
      });
      photoPlaceholder.set('id', 'photo');
      canvas.add(border, titleText, nameText, cargoText, photoPlaceholder);
    }

    canvas.on('selection:created', (e) => {
      const obj = e.selected?.[0];
      if (obj) {
        const id = obj.get('id');
        setSelectedObject(id || null);
      }
    });

    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    fabricRef.current = canvas;

    if (initialPhoto) {
      fabric.Image.fromURL(initialPhoto, (img) => {
        img.set({
          left: template === 'horizontal' ? 285 : 85,
          top: 65,
          scaleX: 90 / (img.width || 100),
          scaleY: 110 / (img.height || 100),
        });
        img.set('id', 'photoImage');
        canvas.add(img);
        canvas.renderAll();
      });
    }

    return canvas;
  }, [width, height, template, initialPhoto]);

  useEffect(() => {
    initCanvas();
    return () => {
      fabricRef.current?.dispose();
    };
  }, [initCanvas]);

  const handleAddText = () => {
    if (!fabricRef.current) return;
    const text = new fabric.IText('Nuevo Texto', {
      left: 50,
      top: 50,
      fontSize: 16,
      fontFamily: 'Arial',
    });
    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
  };

  const handleAddShape = (shape: 'rect' | 'circle' | 'triangle') => {
    if (!fabricRef.current) return;
    let shapeObj: fabric.Object;

    switch (shape) {
      case 'rect':
        shapeObj = new fabric.Rect({ left: 50, top: 50, width: 80, height: 50, fill: '#4A90D9' });
        break;
      case 'circle':
        shapeObj = new fabric.Circle({ left: 50, top: 50, radius: 40, fill: '#D94A4A' });
        break;
      case 'triangle':
        shapeObj = new fabric.Triangle({ left: 50, top: 50, width: 80, height: 60, fill: '#4AD94A' });
        break;
    }

    fabricRef.current.add(shapeObj);
    fabricRef.current.setActiveObject(shapeObj);
  };

  const handleDeleteSelected = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach((obj) => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  };

  const handleBringForward = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.bringObjectForward(activeObject);
      canvas.renderAll();
    }
  };

  const handleSendBackward = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.sendObjectBackwards(activeObject);
      canvas.renderAll();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricRef.current) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      fabric.Image.fromURL(imgUrl, (img) => {
        const canvas = fabricRef.current!;
        const maxWidth = 120;
        const maxHeight = 140;
        
        const scale = Math.min(maxWidth / (img.width || 1), maxHeight / (img.height || 1));
        
        img.set({
          left: template === 'horizontal' ? 285 : 85,
          top: 65,
          scaleX: scale,
          scaleY: scale,
        });
        img.set('id', 'photoImage');
        
        const existingPhoto = canvas.getObjects().find(obj => obj.get('id') === 'photoImage');
        if (existingPhoto) {
          canvas.remove(existingPhoto);
        }
        
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        setLoading(false);
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!fabricRef.current) return;
    setLoading(true);
    
    const dataUrl = fabricRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });
    
    onSave?.(dataUrl);
    setLoading(false);
  };

  return (
    <div className="fotocheck-editor">
      <div className="editor-toolbar">
        <div className="toolbar-section">
          <Button variant="outline" size="sm" onClick={handleAddText}>Agregar Texto</Button>
          <Button variant="outline" size="sm" onClick={() => handleAddShape('rect')}>Rectángulo</Button>
          <Button variant="outline" size="sm" onClick={() => handleAddShape('circle')}>Círculo</Button>
          <Button variant="outline" size="sm" onClick={() => handleAddShape('triangle')}>Triángulo</Button>
        </div>
        <div className="toolbar-section">
          <label className="upload-image-btn">
            <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
            Subir Foto
          </label>
        </div>
        <div className="toolbar-section">
          {selectedObject && (
            <>
              <Button variant="outline" size="sm" onClick={handleBringForward}>Adelante</Button>
              <Button variant="outline" size="sm" onClick={handleSendBackward}>Atrás</Button>
              <Button variant="outline" size="sm" onClick={handleDeleteSelected}>Eliminar</Button>
            </>
          )}
        </div>
      </div>
      
      <div className="editor-canvas-container">
        <canvas ref={canvasRef} />
        {loading && <div className="loading-overlay"><Spinner /></div>}
      </div>

      <div className="editor-actions">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Diseño'}
        </Button>
      </div>
    </div>
  );
};

export default FotocheckEditor;