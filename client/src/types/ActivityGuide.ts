// 활동 방법 관련 타입 정의

export interface ActivityGuideSlide {
  id: string
  image: string
  title?: string
  description?: string
  audioPath?: string
}

export interface ActivityGuideModalProps {
  isOpen: boolean
  onClose: () => void
  slides: ActivityGuideSlide[]
  className?: string
}

// 각 페이지별 활동 방법 슬라이드 템플릿
export const createActivityGuideSlides = (pageId: string): ActivityGuideSlide[] => {
  const slidesMap: Record<string, ActivityGuideSlide[]> = {
    '5-1-1': [
      {
        id: 'slide1',
        image: '/img/guide/5-1-1/guide1.png',
        title: '활동 방법 1',
        description: '각 단계별 버튼을 클릭하여 공룡 화석이 만들어지는 과정을 확인해보세요.',
        audioPath: '/sounds/5-1-1/guide/guide1.mp3'
      },
      {
        id: 'slide2',
        image: '/img/guide/5-1-1/guide2.png',
        title: '활동 방법 2',
        description: '재생 버튼을 클릭하면 각 단계의 애니메이션을 볼 수 있습니다.',
        audioPath: '/sounds/5-1-1/guide/guide2.mp3'
      },
      {
        id: 'slide3',
        image: '/img/guide/5-1-1/guide3.png',
        title: '활동 방법 3',
        description: '마우스를 드래그하여 3D 모델을 자유롭게 관찰할 수 있습니다.',
        audioPath: '/sounds/5-1-1/guide/guide3.mp3'
      }
    ],
    // 다른 페이지들을 위한 템플릿도 여기에 추가 가능
    '6-1-1': [
      {
        id: 'slide1',
        image: '/img/guide/6-1-1/guide1.png',
        title: '활동 방법 1',
        description: '6-1-1 페이지의 첫 번째 활동 방법입니다.',
        audioPath: '/sounds/6-1-1/guide/guide1.mp3'
      }
      // 추가 슬라이드...
    ]
    // 필요에 따라 다른 페이지 추가
  }

  return slidesMap[pageId] || []
}