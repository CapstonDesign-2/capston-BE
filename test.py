import json
import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import norm

# JSON 파일 경로
file_path = 'data/userData.json'

# JSON 데이터 로드
with open(file_path, 'r') as file:
    data = json.load(file)

# totalScore 추출
total_scores = [user['totalScore'] for user in data]

# 정규분포 파라미터 계산
mean = np.mean(total_scores)
std_dev = np.std(total_scores)

# 정규분포 곡선 생성
x = np.linspace(mean - 3*std_dev, mean + 3*std_dev, 100)
y = norm.pdf(x, mean, std_dev)

# 그래프 그리기
plt.figure(figsize=(10, 6))
plt.plot(x, y, color='blue', label='Normal Distribution')
plt.hist(total_scores, bins=30, density=True, alpha=0.5, color='gray', label='Total Score Histogram')
plt.title('Normal Distribution of Total Scores')
plt.xlabel('Total Score')
plt.ylabel('Density')
plt.legend()
plt.grid()
plt.show()

# 총 데이터 개수 출력
print(f"Total Data Count: {len(data)}")