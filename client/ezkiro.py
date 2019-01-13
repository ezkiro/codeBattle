#!/usr/bin/env python

import asyncio
import websockets
import json
import sys, random

#plan control
class BattlePlan:
    def __init__(self):
        #key: plan  val: try, win
        self.curPlan = 'MAIN'
        self.stat = {}
        self.stat['MAIN'] = [1,1]
        self.stat['STAT'] = [1,1]

    def setPlan(self, plan):
        self.curPlan = plan

    def getPlan(self):
        return self.curPlan

    def betterPlan(self, round):
        if round == 1:
            return 'MAIN'
        winRate = {}
        for key, val in self.stat.items():
            if val[0] == 0:
                winRate[key] = 51 # for init value
            else:    
                winRate[key] = (val[1] * 100)/val[0]
        better = sorted(list(winRate.items()),key=lambda item:item[1])
        print(f"[betterPlan] round:{round} plan:{better[-1][0]}, winRate:{winRate}")
        #for special case
        if winRate['MAIN'] == winRate['STAT']:
            return 'MAIN'
        return better[-1][0]

    def setRoundResult(self, plan, result):
        self.stat[plan][0] += 1
        if result == 'win':
            self.stat[plan][1] += 1
        print(f"[setRoundResult] stat:{self.stat}")

ART_T={}
ART_T['AH']=('0',0)
ART_T['AB']=('1',1)
ART_T['AL']=('2',2)
ART_T['DH']=('10',10)
ART_T['DB']=('11',11)
ART_T['DL']=('12',12)
ART_T['AS']=('3',3)

ART_IDX=[0,1,2,10,11,12,3]

EN_MODE = 'R' # R: rondom C:cust D:decoy
EN_MODE_TRY_CNT={}

EST_MODE = 1

CUR_ROUND=0
CUR_MATCH=0
MY_HP=0
MY_SCORE=[] # win,draw,defeat
ENEMY_HP=0

EN_PATTERNS=[] #10
EN_PAT_TEMP=[]

MY_CARDS={}
EN_CARDS={}
SP_FLAG=False

MY_PRE_CARD={}
EN_FIRST_CARD={}

EST_TRY_MAX = 10
EST_TRY = EST_TRY_MAX

DECOY_TRY_MAX = 3
DECOY_TRY = DECOY_TRY_MAX

ALDL_NEXT=[(1,12),(1,11),(2,11),(2,12)]
ABDL_NEXT=[(1,11),(2,11),(2,12),(1,12)]
ABDB_NEXT=[(2,11),(2,12),(1,12),(1,11)]
ALDB_NEXT=[(2,12),(1,12),(1,11),(2,11)]

ALDL_NEXT_CNT=[0,0,0,0]
ABDL_NEXT_CNT=[0,0,0,0]
ABDB_NEXT_CNT=[0,0,0,0]
ALDB_NEXT_CNT=[0,0,0,0]

def initNextTable():
    global ALDL_NEXT_CNT
    global ABDL_NEXT_CNT
    global ABDB_NEXT_CNT
    global ALDB_NEXT_CNT

    ALDL_NEXT_CNT=[0,0,0,0]
    ABDL_NEXT_CNT=[0,0,0,0]
    ABDB_NEXT_CNT=[0,0,0,0]
    ALDB_NEXT_CNT=[0,0,0,0]    

def strCardToIntCard(strCard):
    temp = strCard.split(',')
    intCard = []
    for i in range(0,10):
        intCard.append(int(temp[i]))
    
    return intCard
        
def getMajorCard(cards):
    sCard = cards.split(',')
    
    at_d={'0':0,'1':0,'2':0,'3':0}
    df_d={'10':0,'11':0,'12':0}
    
    for i in range(0,10):
        if sCard[i] in at_d:
            at_d[sCard[i]]+=1
        
        if sCard[i] in df_d:
            df_d[sCard[i]]+=1
    
    aCard = sorted(list(at_d.items()), key=lambda item:item[1])
    #print(f"[getMajorCard] aCard:{aCard}")
    
    dCard = sorted(list(df_d.items()),key=lambda item:item[1])
    #print(f"[getMajorCard] dCard:{dCard}")
    #print(f"[getMajorCard] aCard:{aCard[0][0]}, dCard:{dCard[0][0]}")
    return int(aCard[3][0]), int(dCard[2][0])

def countNEXT(myA,myD,enCards):
    global ALDL_NEXT
    global ABDL_NEXT
    global ABDB_NEXT
    global ALDB_NEXT
    global ALDL_NEXT_CNT
    global ABDL_NEXT_CNT
    global ABDB_NEXT_CNT
    global ALDB_NEXT_CNT
    
    enA,enD = getMajorCard(enCards)

    #print(f"[countNext] myA:{myA}, myD:{myD}, enA:{enA}, enD:{enD}")
    
    if myA == ART_T['AL'][1] and myD == ART_T['DL'][1]:
        for i in range(0,4):
            if ALDL_NEXT[i][0] == enA and ALDL_NEXT[i][1] == enD:
                ALDL_NEXT_CNT[i]+=1
    elif myA == ART_T['AB'][1] and myD == ART_T['DL'][1]:
        for i in range(0,4):
            if ABDL_NEXT[i][0] == enA and ABDL_NEXT[i][1] == enD:
                ABDL_NEXT_CNT[i]+=1                
    elif myA == ART_T['AB'][1] and myD == ART_T['DB'][1]:
        for i in range(0,4):
            if ABDB_NEXT[i][0] == enA and ABDB_NEXT[i][1] == enD:
                ABDB_NEXT_CNT[i]+=1
    elif myA == ART_T['AL'][1] and myD == ART_T['DB'][1]:
        for i in range(0,4):
            if ALDB_NEXT[i][0] == enA and ALDB_NEXT[i][1] == enD:
                ALDB_NEXT_CNT[i]+=1
    else:
        print(f"[countNEXT] unexpected type! myA:{myA} myD:{myD} ,enA:{enA} enD:{enD}")
    
    #print(f"[ALDL_NEXT_CNT] A0:{ALDL_NEXT_CNT[0]} A1:{ALDL_NEXT_CNT[1]} A2:{ALDL_NEXT_CNT[2]} A3:{ALDL_NEXT_CNT[3]}")
    #print(f"[ABDL_NEXT_CNT] A0:{ABDL_NEXT_CNT[0]} A1:{ABDL_NEXT_CNT[1]} A2:{ABDL_NEXT_CNT[2]} A3:{ABDL_NEXT_CNT[3]}")
    #print(f"[ABDB_NEXT_CNT] A0:{ABDB_NEXT_CNT[0]} A1:{ABDB_NEXT_CNT[1]} A2:{ABDB_NEXT_CNT[2]} A3:{ABDB_NEXT_CNT[3]}")
    #print(f"[ALDB_NEXT_CNT] A0:{ALDB_NEXT_CNT[0]} A1:{ALDB_NEXT_CNT[1]} A2:{ALDB_NEXT_CNT[2]} A3:{ALDB_NEXT_CNT[3]}")    
    
def estimateCard(PreMyA,PreMyD):
    global ALDL_NEXT
    global ABDL_NEXT
    global ABDB_NEXT
    global ALDB_NEXT
    global ALDL_NEXT_CNT
    global ABDL_NEXT_CNT
    global ABDB_NEXT_CNT
    global ALDB_NEXT_CNT
    global EST_MODE
    
#    myA,myD = getMajorCard(myCards)
    myA,myD= PreMyA,PreMyD
    
    anti_idx = 0
    anti_tbl =[]
    if myA == ART_T['AL'][1] and myD == ART_T['DL'][1]:
        anti_tbl = ALDL_NEXT
        maxCnt = ALDL_NEXT_CNT[anti_idx]
        for i in range(0,4):
            if maxCnt < ALDL_NEXT_CNT[i]:
                anti_idx = i
                maxCnt = ALDL_NEXT_CNT[i]
    elif myA == ART_T['AB'][1] and myD == ART_T['DL'][1]:
        anti_tbl = ABDL_NEXT    
        maxCnt = ABDL_NEXT_CNT[anti_idx]
        for i in range(0,4):
            if maxCnt < ABDL_NEXT_CNT[i]:
                anti_idx = i
                maxCnt = ABDL_NEXT_CNT[i]    
    elif myA == ART_T['AB'][1] and myD == ART_T['DB'][1]:
        anti_tbl = ABDB_NEXT    
        maxCnt = ABDB_NEXT_CNT[anti_idx]
        for i in range(0,4):
            if maxCnt < ABDB_NEXT_CNT[i]:
                anti_idx = i
                maxCnt = ABDB_NEXT_CNT[i]                
    elif myA == ART_T['AL'][1] and myD == ART_T['DB'][1]:
        anti_tbl = ALDB_NEXT
        maxCnt = ALDB_NEXT_CNT[anti_idx]
        for i in range(0,4):
            if maxCnt < ALDB_NEXT_CNT[i]:
                anti_idx = i
                maxCnt = ALDB_NEXT_CNT[i]    
    else:
        print(f"[estimateCard] unexpected type! myA:{myA}, myD:{myD}")
        anti_tbl = ABDB_NEXT

    anti_idx1 = anti_idx
    
    print('[estimateCard] anti_idx1:%d enA:%d,enD:%d,myEA:%d,myED:%d' % (anti_idx1,anti_tbl[anti_idx1][0],anti_tbl[anti_idx1][1],anti_tbl[(anti_idx1+1) % 4][0],anti_tbl[(anti_idx1+1) % 4][1]))
    
    anti_total = [0,0,0,0]
    for i in range(0,4):
        anti_total [i] = ALDL_NEXT_CNT[i] + ABDL_NEXT_CNT[i] + ABDB_NEXT_CNT[i] + ALDB_NEXT_CNT[i]
        
    anti_idx2 = 0    
    maxCnt = anti_total[anti_idx2]

    for i in range(0,4):
        if maxCnt < anti_total[i]:
            anti_idx2 = i
            maxCnt = anti_total[i]
    
    print('[estmateCard] anti_idx2:%d' % (anti_idx2))
    
    final_idx = 0
    if EST_MODE == 1:
        final_idx = anti_idx1
    else:
        final_idx = anti_idx2
    
    return  anti_tbl[(final_idx+1) % 4][0],anti_tbl[(final_idx+1) % 4][1]

def antiCard(myA,myD,antiDepth):
    global ALDL_NEXT
    global ABDL_NEXT
    global ABDB_NEXT
    global ALDB_NEXT

    anti_idx = 0
    anti_tbl =[]
    if myA == ART_T['AL'][1] and myD == ART_T['DL'][1]:
        anti_tbl = ALDL_NEXT
    elif myA == ART_T['AB'][1] and myD == ART_T['DL'][1]:
        anti_tbl = ABDL_NEXT    
    elif myA == ART_T['AB'][1] and myD == ART_T['DB'][1]:
        anti_tbl = ABDB_NEXT    
    elif myA == ART_T['AL'][1] and myD == ART_T['DB'][1]:
        anti_tbl = ALDB_NEXT
    else:
        print('[antiCard] unexpected type! myA:%d, myD:%d' % (myA,myD))
    
    antiA = anti_tbl[antiDepth][0]
    antiD = anti_tbl[antiDepth][1]
    
    return antiA,antiD
    
def vsCard(card): #AH ->DH, AB->DB, AL->DL,DH->AL,DB->AL,DL->AB
    if card < ART_T['DH'][1] :
        return card + 10
    else:
        if card == ART_T['DH'][1]:
            return ART_T['AL'][1]
        elif card == ART_T['DB'][1]:
            return ART_T['AL'][1]
        else :
            return ART_T['AB'][1]
            
def getMaxCard():
    global EN_PATTERNS
    print(f"[getMaxCard] EN_PATTERNS:{EN_PATTERNS}")
    cards_sum =[0,0,0,0,0,0]
    for i in range(10):
        for j in range(6):
            cards_sum[j]+=EN_PATTERNS[i][j]
    
    aCardMax = 0
    aCardIdx = 0
    for i in range(0,3):
        if aCardMax <= cards_sum[i]:
            aCardMax = cards_sum[i]
            aCardIdx = i

    dCardMax = 0
    dCardIdx = 0        
    for i in range(3,6):
        if dCardMax <= cards_sum[i]:
            dCardMax = cards_sum[i]
            dCardIdx = i    
    
    print('[getMaxCard] aCardIdx:%d dCardIdx:%d ,enMaxA:%d enMaxD:%d' % (aCardIdx,dCardIdx,ART_IDX[aCardIdx],ART_IDX[dCardIdx]))
    return vsCard(ART_IDX[dCardIdx]),vsCard(ART_IDX[aCardIdx])
    
def checkMatch(round,match,myCards,enCards):
    global EN_MODE
    global CUR_MATCH
    global CUR_ROUND
    global EST_TRY
    global EST_TRY_MAX
    global DECOY_TRY
    global DECOY_TRY_MAX
    global EST_MODE

    #only Stat mode
    if EN_MODE == 'S':
        return

    if EN_MODE == 'R':
        print('[checkMatch] decoy Try:%d' % (DECOY_TRY))
        if checkDamage(myCards,enCards) == False:        
            DECOY_TRY -= 1
            
        if DECOY_TRY < 0 :
            EN_MODE = 'P'
            DECOY_TRY = DECOY_TRY_MAX
            return
        else:
            return
    
    myA,myD = MY_PRE_CARD[CUR_ROUND*1000 + CUR_MATCH]
    enCard = strCardToIntCard(enCards)
    
    myASuc = 0
    myDSuc = 0
    spCnt = 0
    
    enEA,enED = antiCard(myA,myD,2)
    
    for i in range(10):
        if enEA == enCard[i] :
            myDSuc += 1
        elif enED == enCard[i] :
            myASuc += 1
        elif 3 == enCard[i]:
            spCnt = 1
    
    if spCnt == 0 and myASuc >= 3 and myDSuc >= 3:
        EN_MODE = 'P'
    elif spCnt == 1 and myASuc >= 3 and myDSuc >= 2:
        EN_MODE = 'P'
    else:
        if EST_MODE == 1:
            EST_MODE = 2
        else:
            EST_MODE = 1

        if checkDamage(myCards,enCards) == False:
            EST_TRY -=1
        if EST_TRY < 0:
            EN_MODE = 'R'
            EST_TRY = EST_TRY_MAX
        else:
            EN_MODE = 'P'
            
    print('[checkMatch] EN_MODE[%s] myA:%d myD:%d , enEA:%d enED:%d spCnt:%d' % (EN_MODE,myA,myD,enEA,enED,spCnt))

def checkDamage(myCards,enCards):
    global MY_SP_CNT
    global EN_SP_CNT
    
    POINT=[10,20,30,100]
    myCard = strCardToIntCard(myCards)
    enCard = strCardToIntCard(enCards)
    
    myDamage = 0
    enDamage = 0
    
    for i in range(0,10):
        if myCard[i] - enCard[i] == 10:     # defense OK
            pass
        elif myCard[i] - enCard[i] == -10:#  attack fail
            pass
        elif myCard[i] < 10 and enCard[i] < 10: # all attack
            myDamage += POINT[enCard[i]]
            enDamage += POINT[myCard[i]]
        elif myCard[i] >= 10 and enCard[i] >= 10: # all defend
            pass
        elif myCard[i] >= 10 and enCard[i] < 10 : # defense Fail
            myDamage += POINT[enCard[i]]
        elif myCard[i] < 10 and enCard[i] >= 10 : # attack OK
            enDamage += POINT[myCard[i]]
        else:
            print('[checkDamage] error case myCard:%d, enCard:%d' % (myCard[i],enCard[i]))
    
    print('[checkDamage] myDamage:%d , enDamage:%d' % (myDamage,enDamage))
    if     enDamage >  myDamage :
        return True
    else:
        return False
        
#======================  old =======================
def filePrint(line):
    f = open('cards2.log','a')
    f.writelines(line + '\n')
    f.close()

def initPattern():
    global EN_PATTERNS
    global EN_MODE
#    EN_MODE = 'D'
    EN_PATTERNS=[]
    for i in range(10):
        EN_PATTERNS.append([0]*7)

def initGlobal():
    global EN_MODE
    global EN_MODE_TRY_CNT
    global CUR_ROUND
    global CUR_MATCH
    global MY_HP
    global MY_SCORE
    global ENEMY_HP
    global EN_PATTERNS
    global EN_PAT_TEMP
    global MY_CARDS
    global EN_CARDS
    global SP_FLAG
    global MY_PRE_CARD
    global EN_FIRST_CARD
    global EST_TRY_MAX
    global EST_TRY
    global DECOY_TRY_MAX
    global DECOY_TRY
    global EST_MODE
    global BATTLE_PLAN

    BATTLE_PLAN = BattlePlan()

    EN_MODE = 'R' # R: rondom C:cust D:decoy
    EN_MODE_TRY_CNT={}

    CUR_ROUND=0
    CUR_MATCH=0
    MY_HP=0
    MY_SCORE=[] # win,draw,defeat
    ENEMY_HP=0

    EN_PATTERNS=[] #10
    EN_PAT_TEMP=[]

    MY_CARDS={}
    EN_CARDS={}
    SP_FLAG=False

    MY_PRE_CARD={}
    EN_FIRST_CARD={}

    EST_TRY_MAX = 10
    EST_TRY = EST_TRY_MAX

    DECOY_TRY_MAX = 3
    DECOY_TRY = DECOY_TRY_MAX
    
    EN_PAT_TEMP=[0,0,0,0,0,0]
    EN_MODE_TRY_CNT['P']=0
    EST_MODE = 1    
    
def countPattern(cards):
    global EN_PATTERNS
    global EN_PAT_TEMP
    tempL=cards.split(',')
    for key in range(0,10):
        val = tempL[key]
        if val == ART_T['AH'][0]:
            EN_PATTERNS[key][0]+=1
            EN_PAT_TEMP[0]+=1
        elif val == ART_T['AB'][0]:
            EN_PATTERNS[key][1]+=1
            EN_PAT_TEMP[1]+=1    
        elif val == ART_T['AL'][0]:
            EN_PATTERNS[key][2]+=1
            EN_PAT_TEMP[2]+=1    
        elif val == ART_T['DH'][0]:
            EN_PATTERNS[key][3]+=1
            EN_PAT_TEMP[3]+=1            
        elif val == ART_T['DB'][0]:
            EN_PATTERNS[key][4]+=1
            EN_PAT_TEMP[4]+=1        
        elif val == ART_T['DL'][0]:
            EN_PATTERNS[key][5]+=1
            EN_PAT_TEMP[5]+=1
        elif val == ART_T['AS'][0]:
            EN_PATTERNS[key][6]+=1
        else:
            pass
            
def printPattern():
    global EN_PATTERNS
    print('=========Enemy Pattern ==========')
    for key in range(0,10):
        print('%2d : AH[%d],AB[%d],AL[%d],DH[%d],DB[%d],DL[%d],AS[%d]' % (key,EN_PATTERNS[key][0],EN_PATTERNS[key][1],EN_PATTERNS[key][2],EN_PATTERNS[key][3],EN_PATTERNS[key][4],EN_PATTERNS[key][5],EN_PATTERNS[key][6]))
        
def randomCard(round,match,spflag):
    global MY_PRE_CARD
    cards=[]
    cards.append([1,1,1,2,2,12,12,12,12,12])
    cards.append([1,1,1,2,2,12,12,12,12,12])
    cards.append([2,2,2,2,2,12,12,12,12,12])
    cards.append([1,1,1,1,1,12,12,12,12,12])
    
    card_pattern=[]
    card_pattern.append((1,12))
    card_pattern.append((1,12))
    card_pattern.append((2,12))
    card_pattern.append((1,12))

    if match < 6:
        idx = random.randrange(0,3,1)
        MY_PRE_CARD[round*1000 + match]=card_pattern[idx]
        return randomCard2(cards[idx],spflag)
    else:    
        myA,myD = getMaxCard()
        MY_PRE_CARD[round*1000 + match]=(myA,myD)
        return vsRandomCard(myA,myD,spflag)
    
def vsRandomCard(attack,defend,spflag):
    attack_cnt = 5
    defend_cnt = 5
    cards=[]
    while attack_cnt + defend_cnt > 0:
        AD_flag = random.randrange(0,2,1)
        if AD_flag == 0 and attack_cnt > 0:
            cards.append(attack)
            attack_cnt-=1
        elif AD_flag == 1 and defend_cnt > 0:
            cards.append(defend)        
            defend_cnt-=1
        else:
            pass
            
    cards=addSP(cards,spflag)
    
    return '%d,%d,%d,%d,%d,%d,%d,%d,%d,%d' % (cards[0],cards[1],cards[2],cards[3],cards[4],cards[5],cards[6],cards[7],cards[8],cards[9])    
    
def randomCard2(cards,spflag):
    attack_cnt = 5
    defend_cnt = 5
#    cards=[1,1,1,2,2,12,12,12,12,12]
    random.shuffle(cards)
            
    cards=addSP(cards,spflag)
    
    return '%d,%d,%d,%d,%d,%d,%d,%d,%d,%d' % (cards[0],cards[1],cards[2],cards[3],cards[4],cards[5],cards[6],cards[7],cards[8],cards[9])        
        
def makeCard(round,match,spflag):
    global EN_MODE
    global MY_PRE_CARD
#    return randomCard()
    
    if round > 1 :
        pass
#        print '[Exit]'
#        return '4,4,4,4,4,4,4,4,4,4'
    
    if EN_MODE == 'S' : # Stats Mode
        myA,myD = statCard()
        MY_PRE_CARD[round*1000 + match] = (myA,myD)
        return vsRandomCard(myA,myD,spflag)

    if EN_MODE == 'R' or match == 0 :
#        myCards=[1,1,1,2,2,12,12,12,12,12]
        cards = randomCard(round,match,spflag)
        
        return cards
    elif EN_MODE == 'P':
        PreMyA,PreMyD = MY_PRE_CARD[round*1000 + match -1]
        myA,myD = estimateCard(PreMyA,PreMyD)
        MY_PRE_CARD[round*1000 + match] = (myA,myD)
        return vsRandomCard(myA,myD,spflag)
    else:
#        myCards=[1,1,2,2,2,12,12,12,12,12]
#        MY_PRE_CARD[round*1000 + match] = (2,12)
        return randomCard(round,match,spflag)

def addSP(cards,SP_FLAG):
#    global SP_FLAG
    
    if SP_FLAG == True:
        a_card_idx=[]
        for key in range(0,10):
            if cards[key] < 10 :
                a_card_idx.append(key)
        
        sp_idx=a_card_idx[random.randrange(0,len(a_card_idx),1)]
        cards[sp_idx] = 3        
    return cards

#choice anti cards of stat
def statCard():
    #[0,1,2,10,11,12] -> [AL,AB,AH,DL,DB,DH]
    global EN_PAT_TEMP
    print(f"[statCard] EN_PAT_TEMP:{EN_PAT_TEMP}")

    enemyACards = {}
    enemyACards['0'] = EN_PAT_TEMP[0]
    enemyACards['1'] = EN_PAT_TEMP[1]
    enemyACards['2'] = EN_PAT_TEMP[2]        

    enemyDCards = {}
    enemyDCards['10'] = EN_PAT_TEMP[3]
    enemyDCards['11'] = EN_PAT_TEMP[4]
    enemyDCards['12'] = EN_PAT_TEMP[5]

    attackCards = sorted(list(enemyACards.items()),key=lambda item:item[1])
    defenseCards = sorted(list(enemyDCards.items()),key=lambda item:item[1])

    print(f"[statCard] attackCards:{attackCards}")
    print(f"[statCard] defenseCards:{defenseCards}")  

    return (int(attackCards[2][0]), int(defenseCards[2][0]))

def gameStart():
    global MY_SCORE
    global EN_MODE_TRY_CNT

    initGlobal()
    MY_SCORE=[0,0,0]    
    EN_MODE_TRY_CNT['D']=0
    print('[gameStart]')

def gameEnd(win_lose):    
    print('[gameEnd] win_lose:' + win_lose)
    
def roundStart(initHP):
    global CUR_ROUND
    global CUR_MATCH
    global MY_ROUND_DATA
    global EN_ROUND_DATA
    global SP_FLAG
    global EN_MODE_TRY_CNT
    global DECOY_TRY
    global DECOY_TRY_MAX
    global EST_TRY
    global EST_TRY_MAX
    global EN_MODE
    global BATTLE_PLAN    
    
    SP_FLAG = False
    CUR_MATCH=0
    CUR_ROUND +=1
    EN_MODE_TRY_CNT['P']=0

    plan = BATTLE_PLAN.betterPlan(CUR_ROUND)
    BATTLE_PLAN.setPlan(plan)

    if plan == 'MAIN':
        EN_MODE = 'P'
    else :
        EN_MODE = 'S'

    DECOY_TRY = DECOY_TRY_MAX    
    EST_TRY = EST_TRY_MAX
    
    initPattern()
    initNextTable() 
    
    print('[roundStart] %d round, init HP:%s' % (CUR_ROUND,initHP))
    
def roundEnd(win_lose):
    global EN_MODE_TRY_CNT
    global BATTLE_PLAN

    BATTLE_PLAN.setRoundResult(BATTLE_PLAN.getPlan(), win_lose)

    if win_lose == 'win':
        MY_SCORE[0]+=1
    elif win_lose == 'draw':
        MY_SCORE[1]+=1
    else:
        MY_SCORE[2]+=1
    print('[roundEnd] my score[win|draw|defeat]:[%d|%d|%d] MY_HP:%d, EN_HP:%d' % (MY_SCORE[0],MY_SCORE[1],MY_SCORE[2],int(MY_HP),int(ENEMY_HP)))
    
    EN_MODE_TRY_CNT['D']=0
    printPattern()        
        
def matchStart():
    global CUR_MATCH
    global MY_CARDS
    global SP_FLAG
    global CUR_ROUND
    
    mycard = makeCard(CUR_ROUND,CUR_MATCH,SP_FLAG)
    
#    print '[matchstart] mycard : %s ' %(mycard)    
    MY_CARDS[CUR_ROUND*1000 + CUR_MATCH]=mycard.split(',')    
    return mycard
    
def matchEnd(selfEnergy, enemyEnergy, enemyPattern,special_attack):
    global MY_HP
    global ENEMY_HP
    global EN_CARDS
    global CUR_MATCH
    global SP_FLAG
    global EN_MODE
    global MY_PRE_CARD
    
    MY_HP = selfEnergy
    ENEMY_HP = enemyEnergy
    EN_CARDS[CUR_ROUND*1000 + CUR_MATCH]=enemyPattern.split(',')
    myCard = MY_CARDS[CUR_ROUND*1000 + CUR_MATCH]
    myPattern = '%s,%s,%s,%s,%s,%s,%s,%s,%s,%s' % (myCard[0],myCard[1],myCard[2],myCard[3],myCard[4],myCard[5],myCard[6],myCard[7],myCard[8],myCard[9])    
    countPattern(enemyPattern)
    checkMatch(CUR_ROUND,CUR_MATCH,myPattern,enemyPattern)
    if CUR_MATCH > 0:
        myPreA,myPreD = MY_PRE_CARD[CUR_ROUND*1000 + CUR_MATCH -1]
#        print '[matchEnd] myPreA:%d,myPreD:%d' % (myPreA,myPreD)
        countNEXT(myPreA,myPreD,enemyPattern)
#        EN_MODE='P'
#    checkPattern(CUR_ROUND,CUR_MATCH)
#    print '[matchEnd] %d match, SE:%s, EE:%s, EP[%s], SP[%s]' % (CUR_MATCH,selfEnergy, enemyEnergy, enemyPattern, special_attack)
    logData = 'round[%d],match[%2d], SE:%s, EE:%s, EP[%s], MP[%s],SP[%s],EN_MODE[%s]' % (CUR_ROUND,CUR_MATCH,selfEnergy, enemyEnergy, enemyPattern,myPattern,special_attack,EN_MODE)    
    filePrint(logData)
    
    CUR_MATCH +=1
    
    if special_attack == '1':
        SP_FLAG = True
    else:
        SP_FLAG = False

#for convert AL ->AH , AH->AL, DH->DL, DL->DH
CARD_T={}
CARD_T['0']='AL'
CARD_T['1']='AB'
CARD_T['2']='AH'
CARD_T['10']='DL'
CARD_T['11']='DB'
CARD_T['12']='DH'

RCARD_T={}
RCARD_T['AL']='0'
RCARD_T['AB']='1'
RCARD_T['AH']='2'
RCARD_T['DL']='10'
RCARD_T['DB']='11'
RCARD_T['DH']='12'

# int -> str card
def toStrCard(patterns):
    cards=[]
    for card in patterns.split(','):
        cards.append(CARD_T[card])
    return cards
# str -> int
def toIntCard(cardArr):
    patterns = []
    for card in cardArr:
        patterns.append(RCARD_T[card])
    return ','.join(patterns)

class Player:
    def __init__(self):
        self.name = 'ezkiro'
    
    def register(self):
        msg = {}
        msg['message'] = 'ReqRegister'
        msg['name'] = self.name

        return json.dumps(msg)

    def handleMessage(self,incomingMessage):
        print(f"incoming message:{incomingMessage}")
        reqMsg = json.loads(incomingMessage)

        resMsg = {}

        if reqMsg['message'] == 'AnsRegister':
            return None
        elif reqMsg['message'] == 'ReqGameStart':
            gameStart()
            resMsg['message'] = 'AnsGameStart'
        elif reqMsg['message'] == 'ReqRoundStart':
            roundStart(10000)
            resMsg['message'] = 'AnsRoundStart'            

        elif reqMsg['message'] == 'ReqMatchStart':
            patterns = matchStart()
            myCard = toStrCard(patterns)
            print(f"[handleMessage] myCard:{myCard}, patterns:{patterns}")

            resMsg['message'] = 'AnsMatchStart'
            resMsg['cards'] = myCard

        elif reqMsg['message'] == 'ReqMatchEnd':
            #{"message":"ReqMatchEnd","myHP":120,"enemyHP":-20,"enemyCards":["AB","AL","DH","DH","DL","AH","DB","AH","DH","AH"]}
            enemyPatterns = toIntCard(reqMsg['enemyCards'])
            matchEnd(reqMsg['myHP'], reqMsg['enemyHP'], enemyPatterns, 'special_attack')         
            resMsg['message'] = 'AnsMatchEnd'

        elif reqMsg['message'] == 'ReqRoundEnd':
            roundEnd(reqMsg['result'])
            resMsg['message'] = 'AnsRoundEnd'

        elif reqMsg['message'] == 'ReqGameEnd':
            gameEnd(reqMsg['result'])           
            resMsg['message'] = 'AnsGameEnd'
        else :
            return None

        return json.dumps(resMsg)


async def battle():
    async with websockets.connect('ws://localhost:8080/match') as websocket:

        player = Player()
        reqMessage = player.register()

        await websocket.send(reqMessage)
        print(f"> {reqMessage}")

        while True:
            message = await websocket.recv()
            print(f"< {message}")
            resMsg = player.handleMessage(message)
            if resMsg != None:
                await websocket.send(resMsg)

asyncio.get_event_loop().run_until_complete(battle())    