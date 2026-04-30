import pandas as pd

def process_titanic_data(input_file, output_file):
    print("⏳ 正在加载 Titanic 数据...")
    df = pd.read_csv(input_file)
    
    # 1. 提取核心维度：客舱等级、性别、年龄、是否存活
    core_columns = ['Pclass', 'Sex', 'Age', 'Survived']
    df_filtered = df[core_columns].copy()
    
    # 2. 数据清理与转换
    # 剔除年龄为空的数据以保证图表准确性
    df_filtered = df_filtered.dropna(subset=['Age'])
    
    # 将数字标签转换为直观的字符串，方便 D3 直接读取渲染
    df_filtered['Survived'] = df_filtered['Survived'].map({0: 'Died', 1: 'Survived'})
    df_filtered['Pclass'] = df_filtered['Pclass'].map({1: '1st Class', 2: '2nd Class', 3: '3rd Class'})
    df_filtered['Sex'] = df_filtered['Sex'].str.capitalize()
    
    # 将年龄分为几个年龄段，便于柱状图或分类图表展示
    bins = [0, 12, 18, 60, 120]
    labels = ['Child', 'Teenager', 'Adult', 'Senior']
    df_filtered['AgeGroup'] = pd.cut(df_filtered['Age'], bins=bins, labels=labels)
    
    # 3. 导出为 JSON 供 D3 使用
    df_filtered.to_json(output_file, orient='records', force_ascii=False)
    
    print(f"✅ 数据处理完成！共保留 {len(df_filtered)} 条有效记录。")
    print(f"📁 文件已保存至：{output_file}")

if __name__ == '__main__':
    # 确保同目录下有 titanic.csv 文件
    process_titanic_data('titanic.csv', 'titanic_clean.json')