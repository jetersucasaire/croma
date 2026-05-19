import { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { Button, Spinner } from '../components/ui';
import './SelloEditor.css';

interface SelloEditorProps {
  width?: number;
  height?: number;
  armazonId?: number;
  mecanismo?: 'automatico' | 'madera' | 'bolsillo';
  forma?: 'circular' | 'rectangular' | 'cuadrada';
  onSave?: (imageData: string) => void;
  onCancel?: () => void;
}

export const SelloEditor = ({ 
  width = 400, 
  height = 400, 
  mecanismo = 'automatico',
  forma = 'circular',
  onSave,
  onCancel 
}: SelloEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [loading, setLoading] = useState(false);
  const [stampType, setStampType] = useState<'text' | 'logo' | 'custom'>('text');
  const [textContent, setTextContent] = useState('NOMBRE EMPRESA');
  const [textLines, setTextLines] = useState<string[]>(['Línea 1', 'Línea 2', 'Línea 3']);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);

  const getTemplateDimensions = () => {
    switch (forma) {
      case 'circular':
        return { width: 300, height: 300, radius: 150 };
      case 'rectangular':
        return { width: 350, height: 200 };
      case 'cuadrada':
        return { width: 280, height: 280 };
    }
  };

  const initCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
      selection: true,
    });

    const template = getTemplateDimensions();
    let border: fabric.Object;

    if (forma === 'circular') {
      border = new fabric.Circle({
        left: (width - template.radius * 2) / 2,
        top: (height - template.radius * 2) / 2,
        radius: template.radius,
        fill: 'transparent',
        stroke: '#333',
        strokeWidth: 3,
        selectable: false,
        evented: false,
      });
    } else if (forma === 'rectangular') {
      border = new fabric.Rect({
        left: (width - template.width) / 2,
        top: (height - template.height) / 2,
        width: template.width,
        height: template.height,
        rx: 10,
        ry: 10,
        fill: 'transparent',
        stroke: '#333',
        strokeWidth: 3,
        selectable: false,
        evented: false,
      });
    } else {
      border = new fabric.Rect({
        left: (width - template.width) / 2,
        top: (height - template.width) / 2,
        width: template.width,
        height: template.width,
        rx: 8,
        ry: 8,
        fill: 'transparent',
        stroke: '#333',
        strokeWidth: 3,
        selectable: false,
        evented: false,
      });
    }

    const logoText = new fabric.IText('LOGO', {
      left: width / 2,
      top: 50,
      fontSize: 24,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      originX: 'center',
      selectable: true,
    });
    logoText.set('id', 'logo');

    const line1 = new fabric.IText('Línea 1', {
      left: width / 2,
      top: 120,
      fontSize: 14,
      fontFamily: 'Arial',
      originX: 'center',
      selectable: true,
    });
    line1.set('id', 'line1');

    const line2 = new fabric.IText('Línea 2', {
      left: width / 2,
      top: 150,
      fontSize: 14,
      fontFamily: 'Arial',
      originX: 'center',
      selectable: true,
    });
    line2.set('id', 'line2');

    const line3 = new fabric.IText('Línea 3', {
      left: width / 2,
      top: 180,
      fontSize: 12,
      fontFamily: 'Arial',
      originX: 'center',
      selectable: true,
    });
    line3.set('id', 'line3');

    canvas.add(border, logoText, line1, line2, line3);

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
    return canvas;
  }, [width, height, forma]);

  useEffect(() => {
    initCanvas();
    return () => {
      fabricRef.current?.dispose();
    };
  }, [initCanvas]);

  const updateTextContent = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    const logoObj = objects.find(obj => obj.get('id') === 'logo');
    const line1Obj = objects.find(obj => obj.get('id') === 'line1');
    const line2Obj = objects.find(obj => obj.get('id') === 'line2');
    const line3Obj = objects.find(obj => obj.get('id') === 'line3');

    if (logoObj && logoObj instanceof fabric.IText) {
      logoObj.set('text', textContent);
    }
    if (line1Obj && line1Obj instanceof fabric.IText) {
      line1Obj.set('text', textLines[0] || '');
    }
    if (line2Obj && line2Obj instanceof fabric.IText) {
      line2Obj.set('text', textLines[1] || '');
    }
    if (line3Obj && line3Obj instanceof fabric.IText) {
      line3Obj.set('text', textLines[2] || '');
    }

    canvas.renderAll();
  };

  useEffect(() => {
    updateTextContent();
  }, [textContent, textLines]);

  const handleLineChange = (index: number, value: string) => {
    const newLines = [...textLines];
    newLines[index] = value;
    setTextLines(newLines);
  };

  const handleAddText = () => {
    if (!fabricRef.current) return;
    const text = new fabric.IText('Nuevo Texto', {
      left: 50,
      top: 50,
      fontSize: 14,
      fontFamily: 'Arial',
    });
    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
  };

  const handleAddShape = (shape: 'rect' | 'circle') => {
    if (!fabricRef.current) return;
    let shapeObj: fabric.Object;

    if (shape === 'rect') {
      shapeObj = new fabric.Rect({ left: 50, top: 50, width: 60, height: 40, fill: '#333' });
    } else {
      shapeObj = new fabric.Circle({ left: 50, top: 50, radius: 30, fill: '#333' });
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

  const handleFontSizeChange = (size: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject instanceof fabric.IText) {
      activeObject.set('fontSize', size);
      canvas.renderAll();
    }
  };

  const handleFontWeightChange = (weight: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject instanceof fabric.IText) {
      activeObject.set('fontWeight', weight);
      canvas.renderAll();
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricRef.current) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      fabric.Image.fromURL(imgUrl, (img) => {
        const canvas = fabricRef.current!;
        
        img.set({
          left: width / 2,
          top: 60,
          originX: 'center',
          originY: 'top',
          scaleX: 0.5,
          scaleY: 0.5,
        });
        
        img.set('id', 'customLogo');
        
        const existingLogo = canvas.getObjects().find(obj => obj.get('id') === 'customLogo');
        if (existingLogo) {
          canvas.remove(existingLogo);
        }
        
        canvas.add(img);
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
    <div className="sello-editor">
      <div className="editor-toolbar">
        <div className="toolbar-section">
          <span className="mecanismo-label">Mecanismo: {mecanismo}</span>
          <span className="forma-label">Forma: {forma}</span>
        </div>
        <div className="toolbar-section">
          <Button variant="outline" size="sm" onClick={handleAddText}>Agregar Texto</Button>
          <Button variant="outline" size="sm" onClick={() => handleAddShape('rect')}>Rectángulo</Button>
          <Button variant="outline" size="sm" onClick={() => handleAddShape('circle')}>Círculo</Button>
          <label className="upload-logo-btn">
            <input type="file" accept="image/*" onChange={handleLogoUpload} hidden />
            Subir Logo
          </label>
        </div>
        <div className="toolbar-section">
          {selectedObject && (
            <>
              <select onChange={(e) => handleFontSizeChange(Number(e.target.value))}>
                <option value="12">12px</option>
                <option value="14">14px</option>
                <option value="16">16px</option>
                <option value="18">18px</option>
                <option value="20">20px</option>
                <option value="24">24px</option>
                <option value="28">28px</option>
                <option value="32">32px</option>
              </select>
              <Button variant="outline" size="sm" onClick={() => handleFontWeightChange('bold')}>Negrita</Button>
              <Button variant="outline" size="sm" onClick={() => handleFontWeightChange('normal')}>Normal</Button>
              <Button variant="outline" size="sm" onClick={handleDeleteSelected}>Eliminar</Button>
            </>
          )}
        </div>
      </div>

      <div className="editor-content">
        <div className="text-settings">
          <div className="setting-group">
            <label>Nombre/Empresa:</label>
            <input 
              type="text" 
              value={textContent} 
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Nombre de la empresa"
            />
          </div>
          <div className="setting-group">
            <label>Línea 1:</label>
            <input 
              type="text" 
              value={textLines[0]} 
              onChange={(e) => handleLineChange(0, e.target.value)}
              placeholder="RUC o identificación"
            />
          </div>
          <div className="setting-group">
            <label>Línea 2:</label>
            <input 
              type="text" 
              value={textLines[1]} 
              onChange={(e) => handleLineChange(1, e.target.value)}
              placeholder="Dirección"
            />
          </div>
          <div className="setting-group">
            <label>Línea 3:</label>
            <input 
              type="text" 
              value={textLines[2]} 
              onChange={(e) => handleLineChange(2, e.target.value)}
              placeholder="Teléfono o contacto"
            />
          </div>
        </div>

        <div className="editor-canvas-container">
          <canvas ref={canvasRef} />
          {loading && <div className="loading-overlay"><Spinner /></div>}
        </div>
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

export default SelloEditor;