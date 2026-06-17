import { Plus, Minus } from 'lucide-react';
import type { MenuItem } from '../../shared/types';

interface MenuCardProps {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export default function MenuCard({ item, quantity, onAdd, onRemove }: MenuCardProps) {
  return (
    <div className="card p-4 card-hover">
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-3xl">
            {item.category === '主食' ? '🍚' : item.category === '汤品' ? '🍜' : item.category === '饮品' ? '☕' : item.category === '沙拉' ? '🥗' : item.category === '烧烤' ? '🍢' : '🍱'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-gray-800">{item.name}</h4>
              {item.description && (
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
              )}
              <span className="inline-block mt-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                {item.category}
              </span>
            </div>
            <span className="text-lg font-bold text-primary-600 whitespace-nowrap">
              ¥{item.price.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="text-sm text-gray-500">
          {quantity > 0 && (
            <span>已选 {quantity} 份，小计 ¥{(item.price * quantity).toFixed(2)}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {quantity > 0 && (
            <>
              <button
                onClick={onRemove}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
            </>
          )}
          <button
            onClick={onAdd}
            className="w-8 h-8 rounded-full bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center transition-colors shadow-sm hover:shadow"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
