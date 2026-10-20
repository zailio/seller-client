'use client';

import { useState, useRef, useEffect } from 'react';
import { FaQuestionCircle, FaComment, FaTimes, FaHeart, FaEdit, FaSave } from 'react-icons/fa';
import { FaCommentSlash, FaFileCircleQuestion, FaThumbsUp } from "react-icons/fa6";
import { ImSpinner2 } from 'react-icons/im';
import styles from '../css/comment.module.css';
import config from '../../../../../utils/config';
import { timeAgo } from '../../../../../utils/fn';
import { FiUser } from "react-icons/fi";
import { MdInfoOutline } from "react-icons/md";
import { BsPatchQuestion } from "react-icons/bs";
import DotMenu from '../../../../../components/dots';

import { useStore } from '../../../../../context/store';

const CommentSection = ({
  auth,
  session,
  setModal,
  productId,
  comment,
  question,
  listComments,
  setListComments,
  commentReplyies,
  setCommentReplyies,
  questions,
  setQuestions,
}) => {
  const { addNotification } = useStore();
  const [replyQ, setReplyQ] = useState(false);
  // State management
  const replyRef = useRef(null);
  const [activeTab, setActiveTab] = useState('comments');
  const [commentText, setCommentText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [onDelete, setOnDelete] = useState(false);
  const [activeReply, setActiveReply] = useState([]);
  const [likeComment, setLikeComment] = useState(false);
  const [replyData, setReplyData] = useState(false);

  // New states for seller functionality
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingAnswer, setEditingAnswer] = useState('');
  const [isUpdatingAnswer, setIsUpdatingAnswer] = useState(false);

  useEffect(() => {
    async function serverData() {
      try {
        if (activeTab === 'comments') {
          if (listComments || !comment) return;
          const res = await fetch(config.SERVER_URL + `/seller/list-comments`, {
            method: 'POST',
            body: JSON.stringify({
              productId,
              page: 1,
              session_id: session
            }),
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            }
          });
          if (!res.ok) {
            throw new Error(`Error: ${res.statusText}`);
          };
          const response = await res.json();
          if (response.data.status) {
            setListComments(response.data.data);
          } else throw Error('Error');
        } else {
          if (questions || !question) return;
          const res = await fetch(config.SERVER_URL + `/seller/list-questions`, {
            method: 'POST',
            body: JSON.stringify({
              productId,
              page: 1,
              session_id: session
            }),
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            }
          });
          if (!res.ok) {
            throw new Error(`Error: ${res.statusText}`);
          };
          const response = await res.json();
          if (response.data.status) {
            setQuestions(response.data.data);
          } else throw Error('Error');
        }
      } catch (e) {
        console.log(e);
        if (activeTab === 'comments') {
          setListComments([]);
        } else {
          setQuestions([]);
        }
      };
    };
    serverData();
  }, [activeTab]);

  // Handle comment submission
  const handleSubmit = async (e) => {
    if (!commentText.trim()) return;
    setIsSending(true);
    try {
      if (activeTab === 'comments') {
        let newComment;
        if (!replyData) {
          newComment = {
            id: Date.now(),
            productId: productId,
            username: 'You',
            img: null,
            text: commentText,
            date: 'Just now',
            like: 0,
            liked: false,
            parent_id: null,
            replies: 0,
            is_me: true,
            is_seller: true
          };
          setListComments(prev => {
            if (prev) {
              return [newComment, ...prev];
            } else return [newComment];
          });
        } else {
          newComment = {
            id: Date.now(),
            productId: productId,
            username: 'You',
            img: null,
            text: commentText,
            date: 'Just now',
            like: 0,
            liked: false,
            parent_id: replyData.id,
            is_me: true,
            is_seller: true
          };
          setListComments(prev => {
            return prev.map(cmt => {
              if (cmt.id === replyData.id) {
                return { ...cmt, replies: cmt.replies + 1 }
              } else return cmt
            });
          });
          setCommentReplyies(prev => ({
            ...prev,
            [replyData.id]: prev[replyData.id]
              ? [newComment, ...prev[replyData.id]]
              : [newComment]
          }));
        }
        const res = await fetch(config.SERVER_URL + `/seller/reply-to-comment`, {
          method: 'POST',
          body: JSON.stringify({ ...newComment, session_id: session }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth}`,
          }
        });
        if (!res.ok) {
          throw new Error(`Error: ${res.statusText}`);
        };
        const resp = await res.json();
        if (!resp.data.status) throw new Error(`Error: Server Error`);
        newComment.id = resp.data.comment_id;
        newComment.username = resp.data.username;
        newComment.date = resp.data.date;
      } else {
        if (!replyQ) return;
        const newComment = {
          id: replyQ.id,
          productId: productId,
          a: commentText,
          session_id: session,
        };
        setQuestions(prev => {
          return prev.map(question => {
            if (question.id === replyQ.id) {
              return { ...question, a: commentText }
            } else return question;
          });
        });
        const res = await fetch(config.SERVER_URL + `/seller/reply-to-question`, {
          method: 'POST',
          body: JSON.stringify(newComment),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth}`,
          }
        });
        if (!res.ok) {
          throw new Error(`Error: ${res.statusText}`);
        };
        const response = await res.json();
        if (!response.data.status) {
          throw new Error(`Error`);
        };
      }
    } catch (e) {
      console.log(e);
      if (activeTab === 'comments') {
        setListComments(prev => {
          if (prev.length > 1) {
            return prev.slice(1);
          } else return false;
        });
      } else {
        setQuestions(prev => {
          return prev.map(question => {
            if (question.id === replyQ.id) {
              return { ...question, a: null }
            } else return question;
          });
        });
      }
    } finally {
      setCommentText('');
      setIsSending(false);
      if (replyQ) setReplyQ(false);
    }
  };

  // New function to handle answer editing/adding for sellers
  const handleEditAnswer = (questionId, currentAnswer = '') => {
    setEditingQuestion(questionId);
    setEditingAnswer(currentAnswer);
  };

  const makeReply = (comment) => {
    if (!auth) return addNotification({
      h2: 'Log In',
      desc: 'Unlock an exclusive discount on all products. Limited time only!',
      tag: 'authentication',
      actions: [
        {
          text: 'Log In Now',
          url: '/authentication'
        },
        {
          text: 'Create Account',
          url: '/authentication'
        }
      ]
    });
    if (!replyRef.current) return;
    setReplyData(comment);
    replyRef.current.classList.add(styles.visible);
  };

  const closeReply = () => {
    if (!replyRef.current) return;
    if (replyQ) setReplyQ(false);
    replyRef.current.classList.remove(styles.visible);
  };

  const openReply = async (id) => {
    setActiveReply(prev => [...prev, id]);
    if (commentReplyies[id]) return;
    try {
      const res = await fetch(config.SERVER_URL + `/actions/get-comment-reply`, {
        method: 'POST',
        body: JSON.stringify({
          comment_id: id,
          productId
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth}`,
        }
      });
      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`);
      };
      const response = await res.json();
      if (response.data.status) {
        setCommentReplyies(prev => ({
          ...prev,
          [id]: response.data.data
        }));
      } else throw Error('Error');
    } catch (e) {
      console.log(e);
      setActiveReply([activeReply]);
    }
  };

  const removeComment = async (id, parent_id) => {
    if (replyData && replyData.id === id) {
      if (replyRef.current) replyRef.current.classList.remove(styles.visible);
      if (replyQ) setReplyQ(false);
      if (replyData) setReplyData(false);
    };
    try {
      const res = await fetch(config.SERVER_URL + `/actions/remove-comment`, {
        method: 'POST',
        body: JSON.stringify({
          comment_id: id,
          productId: productId
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth}`,
        }
      });
      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`);
      };
      const resp = await res.json();
      if (!resp.data.status) throw new Error(`Error: Server Error`);
      if (parent_id === false) {
        setListComments(prev => {
          return prev.filter(a => a.id !== id);
        });
      } else {
        const comment = [...commentReplyies[parent_id]].filter(a => a.id !== id);
        setCommentReplyies(prev => ({
          ...prev,
          [parent_id]: comment
        }));
      };
    } catch (e) {
      console.log(e);
    } finally {
      setOnDelete(false);
    }
  };

  // Generate menu options for comments based on user role
  const getCommentMenuOptions = (comment, parent_id) => {
    const options = [];

    if (comment.is_me) {
      options.push({
        title: 'remove',
        attrs: [comment.id, parent_id],
        fn: removeComment,
        color: 'red'
      });
    }

    return options;
  };

  const replyToQuestion = (qustion) => {
    replyRef.current.classList.add(styles.visible);
    setReplyQ(qustion);
  };

  return (
    <div className={styles.parent}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'comments' ? styles.active : ''}`}
              onClick={() => setActiveTab('comments')}
            >
              <FaComment /> Comments
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'questions' ? styles.active : ''}`}
              onClick={() => setActiveTab('questions')}
            >
              <FaQuestionCircle /> Questions
            </button>
          </div>
          <button className={styles.closeButton} onClick={() => setModal(false)}>
            <FaTimes />
          </button>
        </div>

        {/* Comments list */}
        <div className={styles.commentsList}>
          {activeTab === 'comments'
            ? !comment && (!listComments && !listComments.length)
              ? <div className={styles.center}>
                <FaCommentSlash size={60} />
                <span>No comments yet</span>
              </div>
              : !listComments
                ? <div className={styles.loadingContainer}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={styles.shimmerItem}>
                      <div className={styles.shimmerAvatar} />
                      <div className={styles.shimmerContent}>
                        <div className={styles.shimmerLine} style={{ width: '30%' }} />
                        <div className={styles.shimmerLine} style={{ width: '80%' }} />
                        <div className={styles.shimmerLine} style={{ width: '60%' }} />
                      </div>
                    </div>
                  ))}
                </div>
                : listComments.map(comment => (
                  <div key={comment.id} className={styles.commentItem}>
                    <div className={styles.commentAvatar}>
                      {comment.img
                        ? <img src={comment.img} />
                        : <FiUser size={24} />
                      }
                      <MdInfoOutline size={15} className={styles.commenterInfo} />
                    </div>
                    <div className={styles.commentContent}>
                      <div className={styles.commentHeader}>
                        <span className={styles.username}>
                          {comment.username}
                          {comment.is_seller && <span className={styles.sellerBadge}>Seller</span>}
                        </span>
                        <span className={styles.date}>{timeAgo(comment.date)}</span>
                      </div>
                      <p className={styles.commentText}>{comment.text}</p>
                      <div className={styles.commentActions}>
                        <button className={styles.likeButton}>
                          <FaHeart color="red" size={16} />
                          <span>{comment.like}</span>
                        </button>
                        <button className={styles.replyBtn} onClick={() => makeReply(comment)}>
                          Reply
                        </button>
                      </div>
                      {comment.replies
                        ? !activeReply.includes(comment.id)
                          ? <button className={styles.viewReplyBtn} onClick={() => openReply(comment.id)}>
                            view {comment.replies} more replies
                          </button>
                          : <div className={styles.repliesList}>
                            {!commentReplyies || !commentReplyies[comment.id] ?
                              <div className={styles.loadingContainer}>
                                <div className={styles.shimmerItem}>
                                  <div className={styles.shimmerAvatar} />
                                  <div className={styles.shimmerContent}>
                                    <div className={styles.shimmerLine} style={{ width: '30%' }} />
                                    <div className={styles.shimmerLine} style={{ width: '80%' }} />
                                    <div className={styles.shimmerLine} style={{ width: '60%' }} />
                                  </div>
                                </div>
                              </div>
                              : commentReplyies[comment.id].map(reply => (
                                <div key={reply.id} className={styles.replyItem}>
                                  <div className={styles.replyCommentAvatar}>
                                    {reply.img
                                      ? <img src={reply.img} />
                                      : <FiUser size={22} />
                                    }
                                  </div>
                                  <div className={styles.replyCommentContent}>
                                    <div className={styles.replyData}>
                                      <div className={styles.commentHeader}>
                                        <span className={styles.replyUsername}>
                                          {reply.username}
                                          {reply.is_seller && <span className={styles.sellerBadge}>Seller</span>}
                                        </span>
                                        <span className={styles.replyTime}>{timeAgo(reply.date)}</span>
                                      </div>
                                      <p className={styles.replyCommentText}>{reply.text}</p>
                                    </div>
                                    <div className={styles.replyActions}>
                                      <button
                                        style={{ padding: 0 }}
                                        className={styles.likeButton}
                                      >
                                        {!likeComment
                                          ? reply.liked
                                            ? <><FaHeart color="red" size={15} />
                                              <span>{reply.like}</span></>
                                            : <><FaHeart color="rgb(162 160 160)" size={15} />
                                              <span>{reply.like}</span></>
                                          : likeComment === reply.id
                                            ? <ImSpinner2 size={15} className={styles.spinner} />
                                            : null
                                        }
                                      </button>
                                      {(reply.is_me || isSeller) && getCommentMenuOptions(reply, comment.id).length > 0
                                        ? onDelete === false
                                          ? <DotMenu
                                            className={styles.commentDot}
                                            size={15}
                                            options={getCommentMenuOptions(reply, comment.id)}
                                          />
                                          : onDelete === reply.id
                                            ? <ImSpinner2 size={15} className={`${styles.commentDot} ${styles.spinner}`} />
                                            : null
                                        : null}
                                    </div>
                                  </div>
                                </div>
                              ))
                            }
                            <button
                              className={styles.hideReplyBtn}
                              onClick={() => setActiveReply(prev => prev.filter(a => a !== comment.id))}>
                              Hide replies
                            </button>
                          </div>
                        : null}
                    </div>
                  </div>
                ))
            : activeTab === 'questions' &&
              !question && !questions
              ? <div className={styles.center}>
                <FaFileCircleQuestion size={60} />
                <span>No questions yet</span>
              </div>
              : !questions
                ? <div className={styles.loadingContainer}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={styles.shimmerItem}>
                      <div className={styles.shimmerAvatar} />
                      <div className={styles.shimmerContent}>
                        <div className={styles.shimmerLine} style={{ width: '30%' }} />
                        <div className={styles.shimmerLine} style={{ width: '80%' }} />
                        <div className={styles.shimmerLine} style={{ width: '60%' }} />
                      </div>
                    </div>
                  ))}
                </div>
                : questions.map(question => (
                  <div key={question.id} className={styles.commentItem}>

                    <BsPatchQuestion size={20} />
                    <div className={styles.questionContent}>
                      <div className={styles.questionInfo}>
                        <p className={styles.questionText}>{question.q}</p>
                        <div className={styles.answerContainer}>
                          <span className={styles.questionAnswer}>{question.a || "No Reply Added"}</span>
                        </div>
                        <div className={styles.commentActions}>
                          <button className={styles.replyQuestion} onClick={() => replyToQuestion(question)}>
                            {
                              question.a ? 'Edit' : 'Reply'
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
        </div>
        <div className={styles.replyContiner} ref={replyRef}>
          {
            replyQ && replyQ.q
              ? <span>replying to question <strong>{replyQ.q}</strong></span>
              : <span>replying to <strong>{replyData?.username}</strong></span>
          }
          <FaTimes size={20} onClick={closeReply} />
        </div>
        {auth && <div className={styles.inputContainer}>
          <div className={styles.characterCounter}>
            {100 - commentText.length + ' remaining'}
          </div>
          <div className={styles.addComment}>
            <textarea
              className={styles.commentInput}
              placeholder={`Add a ${activeTab === 'comments' ? 'comment' : 'question'}...`}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={isSending}
            />
            <button
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={!commentText.trim() || isSending || (100 - commentText.length) <= 0}
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>}
      </div>
    </div >
  );
};

export default CommentSection;