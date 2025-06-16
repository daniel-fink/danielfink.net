export function columns() {
    const columns = document.createElement('div');
    columns.className = 'columns';

    const left = document.createElement('div');
    left.className = 'left';
    left.textContent = 'left';

    const right = document.createElement('div');
    right.className = 'right';
    right.textContent = 'right';

    columns.append(left, right);
    return {columns, left, right};
}